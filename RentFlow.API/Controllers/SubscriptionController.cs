using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentFlow.API.Data;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;

namespace RentFlow.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private static readonly HttpClient _httpClient = new HttpClient();

        public SubscriptionController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            // Check if subscription expired
            if (user.IsPremium && user.SubscriptionExpiresAt.HasValue && user.SubscriptionExpiresAt.Value < DateTime.UtcNow)
            {
                user.IsPremium = false;
                user.SubscriptionPlan = null;
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                user.IsPremium,
                user.SubscriptionPlan,
                user.SubscriptionExpiresAt
            });
        }

        [HttpPost("verify-paystack")]
        public async Task<IActionResult> VerifyPaystack([FromBody] VerifyPaystackDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            if (string.IsNullOrWhiteSpace(dto.Reference))
            {
                return BadRequest("Payment reference is required.");
            }

            var secretKey = _configuration["Paystack:SecretKey"];
            bool isVerified = false;

            // If a real Paystack secret key is configured, verify against Paystack API
            if (!string.IsNullOrEmpty(secretKey) && !secretKey.Contains("placeholder") && !secretKey.StartsWith("pk_"))
            {
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.paystack.co/transaction/verify/{dto.Reference}");
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);

                    var response = await _httpClient.SendAsync(request);
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(content);
                        if (doc.RootElement.TryGetProperty("data", out var dataEl) &&
                            dataEl.TryGetProperty("status", out var statusEl) &&
                            statusEl.GetString() == "success")
                        {
                            isVerified = true;
                        }
                    }
                }
                catch (Exception ex)
                {
                    return StatusCode(500, $"Error contacting Paystack: {ex.Message}");
                }
            }
            else
            {
                // In Development/Test mode with test or placeholder keys, accept the reference
                isVerified = true;
            }

            if (!isVerified)
            {
                return BadRequest("Paystack verification failed: Transaction was not marked as successful.");
            }

            var plan = dto.Plan ?? "ProMonthly";
            user.IsPremium = true;
            user.SubscriptionPlan = plan;
            user.SubscriptionExpiresAt = plan.ToLower().Contains("annual")
                ? DateTime.UtcNow.AddYears(1)
                : DateTime.UtcNow.AddMonths(1);

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = "Subscription activated! All ads have been removed.",
                user.IsPremium,
                user.SubscriptionPlan,
                user.SubscriptionExpiresAt
            });
        }

        [HttpPost("toggle-demo")]
        public async Task<IActionResult> ToggleDemoSubscription()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            user.IsPremium = !user.IsPremium;
            user.SubscriptionPlan = user.IsPremium ? "ProDemo" : null;
            user.SubscriptionExpiresAt = user.IsPremium ? DateTime.UtcNow.AddMonths(1) : null;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                user.IsPremium,
                user.SubscriptionPlan,
                user.SubscriptionExpiresAt,
                Message = user.IsPremium ? "RentFlow Pro enabled (Ads removed)!" : "Reverted to Free tier (Ads enabled)."
            });
        }
    }

    public class VerifyPaystackDto
    {
        public string Reference { get; set; } = string.Empty;
        public string? Plan { get; set; } = "ProMonthly";
    }
}
