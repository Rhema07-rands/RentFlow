using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RentFlow.API.Data;
using RentFlow.API.Models;
using RentFlow.API.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RentFlow.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ICloudinaryService _cloudinaryService;

        public AuthController(ApplicationDbContext context, IConfiguration configuration, ICloudinaryService cloudinaryService)
        {
            _context = context;
            _configuration = configuration;
            _cloudinaryService = cloudinaryService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("User with this email already exists.");

            string? uploadedUrl = null;
            if (!string.IsNullOrEmpty(dto.ProfilePictureBase64))
            {
                try
                {
                    var cloudName = _configuration["Cloudinary:CloudName"];
                    var apiKey = _configuration["Cloudinary:ApiKey"];
                    var apiSecret = _configuration["Cloudinary:ApiSecret"];
                    
                    var account = new CloudinaryDotNet.Account(cloudName, apiKey, apiSecret);
                    var cloudinary = new CloudinaryDotNet.Cloudinary(account);

                    // Add data URI prefix if missing
                    var base64Str = dto.ProfilePictureBase64;
                    if (!base64Str.StartsWith("data:image"))
                    {
                        base64Str = "data:image/jpeg;base64," + base64Str;
                    }

                    var uploadParams = new CloudinaryDotNet.Actions.ImageUploadParams()
                    {
                        File = new CloudinaryDotNet.FileDescription(base64Str),
                        Folder = "rentflow_profiles"
                    };

                    var uploadResult = await cloudinary.UploadAsync(uploadParams);
                    if (uploadResult.Error != null)
                    {
                        return BadRequest("Failed to upload profile picture: " + uploadResult.Error.Message);
                    }
                    
                    uploadedUrl = uploadResult.SecureUrl.ToString();
                }
                catch (Exception ex)
                {
                    return BadRequest("Error uploading profile picture: " + ex.Message);
                }
            }

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                PhoneNumber = dto.PhoneNumber,
                Gender = dto.Gender,
                Address = dto.Address,
                ProfilePictureUrl = uploadedUrl
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Registration successful" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized("Invalid email or password.");

            var token = GenerateJwtToken(user);
            return Ok(new { 
                Token = token, 
                User = new { 
                    user.Id, 
                    user.Name, 
                    user.Email, 
                    user.ProfilePictureUrl,
                    user.IsPremium,
                    user.SubscriptionPlan,
                    user.SubscriptionExpiresAt
                } 
            });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var keyStr = jwtSettings["Key"] ?? "SecretKeyReplacementForConfig123!";
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(keyStr));
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            };

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = creds
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            
            return tokenHandler.WriteToken(token);
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.PhoneNumber,
                user.ProfilePictureUrl,
                user.IsPremium,
                user.SubscriptionPlan,
                user.SubscriptionExpiresAt
            });
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromForm] ProfileUpdateDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            // Update basic details
            user.Name = dto.Name;
            user.Email = dto.Email;
            user.PhoneNumber = dto.PhoneNumber;

            // Handle Profile Picture if a new one is provided
            if (dto.ProfilePicture != null)
            {
                // Delete existing picture from Cloudinary if there is one
                if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
                {
                    try
                    {
                        var uri = new Uri(user.ProfilePictureUrl);
                        var segments = uri.AbsolutePath.Split('/');
                        var fileNameWithExtension = segments[segments.Length - 1];
                        var folderName = segments[segments.Length - 2];
                        var publicId = $"{folderName}/{Path.GetFileNameWithoutExtension(fileNameWithExtension)}";
                        await _cloudinaryService.DeleteImageAsync(publicId);
                    }
                    catch (Exception)
                    {
                        // Ignore errors deleting the old profile picture (e.g., if it's an old hardcoded URL)
                    }
                }

                // Upload new picture
                var newUrl = await _cloudinaryService.UploadImageAsync(dto.ProfilePicture);
                user.ProfilePictureUrl = newUrl;
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Profile updated successfully.",
                user.Id,
                user.Name,
                user.Email,
                user.PhoneNumber,
                user.ProfilePictureUrl
            });
        }

        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            // Find the logged-in user
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            // Verify the current password is correct
            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            {
                return BadRequest("Current password is incorrect.");
            }

            // Validate new password matches confirmation
            if (dto.NewPassword != dto.ConfirmNewPassword)
            {
                return BadRequest("New passwords do not match.");
            }

            // Hash the new password and save it
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Password changed successfully." });
        }
    }

    public class RegisterDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? ProfilePictureBase64 { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }

    public class ProfileUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public IFormFile? ProfilePicture { get; set; }
    }
}
