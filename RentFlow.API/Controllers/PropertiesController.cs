using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentFlow.API.Data;
using RentFlow.API.Models;
using System.Security.Claims;

namespace RentFlow.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PropertiesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly RentFlow.API.Services.ICloudinaryService _cloudinaryService;

        public PropertiesController(ApplicationDbContext context, RentFlow.API.Services.ICloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetProperties(
            [FromQuery] string? query,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] int? beds,
            [FromQuery] int? baths,
            [FromQuery] string? propertyType)
        {
            var queryable = _context.Properties
                .Include(c => c.Owner)
                .Include(p => p.Images)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(query))
            {
                var q = query.ToLower();
                queryable = queryable.Where(t => t.Title.ToLower().Contains(q) || t.Location.ToLower().Contains(q));
            }

            if (minPrice.HasValue)
                queryable = queryable.Where(p => p.Price >= minPrice.Value);

            if (maxPrice.HasValue)
                queryable = queryable.Where(p => p.Price <= maxPrice.Value);

            if (beds.HasValue)
                queryable = queryable.Where(p => p.Beds >= beds.Value);

            if (baths.HasValue)
                queryable = queryable.Where(p => p.Baths >= baths.Value);

            if (!string.IsNullOrWhiteSpace(propertyType) && propertyType != "All")
                queryable = queryable.Where(p => p.PropertyType == propertyType);

            var properties = await queryable
                .OrderByDescending(p => p.Views)
                .Select(p => new {
                    p.Id, p.Title, p.Description, p.Price, p.Location, p.Status,
                    p.Beds, p.Baths, p.Sqft, p.PropertyType, p.Views,
                    Images = p.Images.Select(i => i.Url),
                    Owner = p.Owner != null ? new { p.Owner.Id, p.Owner.Name, p.Owner.ProfilePictureUrl } : null
                })
                .ToListAsync();

            return Ok(properties);
        }

        [HttpGet("my-listings")]
        public async Task<IActionResult> GetMyListings()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var properties = await _context.Properties
                .Include(p => p.Images)
                .Where(p => p.OwnerId == userId)
                .OrderByDescending(p => p.Id)
                .Select(p => new {
                    p.Id, p.Title, p.Description, p.Price, p.Location, p.Status,
                    p.Beds, p.Baths, p.Sqft, p.PropertyType, p.Views,
                    Images = p.Images.Select(i => i.Url)
                })
                .ToListAsync();

            return Ok(properties);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found.");
            if (property.OwnerId != userId) return Unauthorized("Not your property.");

            property.Status = dto.Status;
            _context.Properties.Update(property);
            await _context.SaveChangesAsync();

            return Ok(new { property.Id, property.Status });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var property = await _context.Properties
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (property == null) return NotFound("Property not found.");
            if (property.OwnerId != userId) return Unauthorized("Not your property.");

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Property deleted successfully." });
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPropertyById(int id)
        {
            var property = await _context.Properties
                .Include(p => p.Owner)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null) return NotFound("Property not found.");

            // Increment view count
            property.Views += 1;
            await _context.SaveChangesAsync();

            return Ok(new {
                property.Id, property.Title, property.Description, property.Price,
                property.Location, property.Status, property.Beds, property.Baths,
                property.PropertyType, property.Views, property.Sqft,
                Amenities = property.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries),
                Images = property.Images.Select(i => new { i.Id, i.Url }),
                Owner = property.Owner != null ? new { property.Owner.Id, property.Owner.Name } : null
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateProperty([FromBody] CreatePropertyDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized("User is not authenticated. Please Sign in to create a property.");
            }

            var property = new Property
            {
                Title = dto.Title,
                Description = dto.Description,
                Price = dto.Price,
                Location = dto.Location,
                Beds = dto.Beds,
                Baths = dto.Baths,
                Sqft = dto.Sqft,
                PropertyType = dto.PropertyType,
                Amenities = dto.Amenities != null && dto.Amenities.Any() ? string.Join(",", dto.Amenities) : string.Empty,
                OwnerId = userId
            };

            _context.Properties.Add(property);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProperties), new { id = property.Id }, property);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] CreatePropertyDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized("User is not authenticated. Please Sign in to update a property.");
            }

            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found.");

            if (property.OwnerId != userId)
            {
                return Unauthorized("You do not have permission to edit this property.");
            }

            property.Title = dto.Title;
            property.Description = dto.Description;
            property.Price = dto.Price;
            property.Location = dto.Location;
            property.Beds = dto.Beds;
            property.Baths = dto.Baths;
            property.Sqft = dto.Sqft;
            property.PropertyType = dto.PropertyType;
            property.Amenities = dto.Amenities != null && dto.Amenities.Any() ? string.Join(",", dto.Amenities) : string.Empty;

            _context.Properties.Update(property);
            await _context.SaveChangesAsync();

            return Ok(property);
        }

        [HttpPost("{id}/images")]
        [RequestSizeLimit(104_857_600)] // 100 MB
        [RequestFormLimits(MultipartBodyLengthLimit = 104_857_600)]
        public async Task<IActionResult> UploadImage(int id, IFormFile file)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found.");

            // Optional: verify the owner is the current user
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId) || property.OwnerId != userId)
            {
                return Unauthorized("You do not have permission to upload images or videos for this property.");
            }

            try
            {
                var url = await _cloudinaryService.UploadMediaAsync(file, "RentFlow");
                var propertyImage = new PropertyImage { PropertyId = id, Url = url };
                
                _context.PropertyImages.Add(propertyImage);
                await _context.SaveChangesAsync();

                return Ok(new { Url = url });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpDelete("{id}/images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int id, int imageId)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found.");

            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId) || property.OwnerId != userId)
            {
                return Unauthorized("You do not have permission to delete media for this property.");
            }

            var image = await _context.PropertyImages.FindAsync(imageId);
            if (image == null) return NotFound("Media not found.");

            if (image.PropertyId != id)
            {
                return BadRequest("Media does not belong to the specified property.");
            }

            try
            {
              var uri = new Uri(image.Url);
              var segments = uri.AbsolutePath.Split('/');
              var fileNameWithExtension = segments[segments.Length - 1];
              var folderName = segments[segments.Length - 2];
              var publicId = $"{folderName}/{Path.GetFileNameWithoutExtension(fileNameWithExtension)}";

              var isVideo = image.Url.Contains("/video/upload/", StringComparison.OrdinalIgnoreCase) ||
                            image.Url.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase) ||
                            image.Url.EndsWith(".webm", StringComparison.OrdinalIgnoreCase) ||
                            image.Url.EndsWith(".mov", StringComparison.OrdinalIgnoreCase) ||
                            image.Url.EndsWith(".m4v", StringComparison.OrdinalIgnoreCase);

              await _cloudinaryService.DeleteMediaAsync(publicId, isVideo);
              _context.PropertyImages.Remove(image);
              await _context.SaveChangesAsync();

              return Ok(new { Message = "Media deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut("{id}/images/{imageId}")]
        [RequestSizeLimit(104_857_600)] // 100 MB
        [RequestFormLimits(MultipartBodyLengthLimit = 104_857_600)]
        public async Task<IActionResult> ReplaceImage(int id, int imageId, IFormFile file)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound("Property not found.");

            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId) || property.OwnerId != userId)
            {
                return Unauthorized("You do not have permission to modify media for this property.");
            }

            var image = await _context.PropertyImages.FindAsync(imageId);
            if (image == null) return NotFound("Media not found.");

            if (image.PropertyId != id)
            {
                return BadRequest("Media does not belong to the specified property.");
            }

            try
            {
                // Delete old media from Cloudinary
                var uri = new Uri(image.Url);
                var segments = uri.AbsolutePath.Split('/');
                var fileNameWithExtension = segments[segments.Length - 1];
                var folderName = segments[segments.Length - 2];
                var publicId = $"{folderName}/{Path.GetFileNameWithoutExtension(fileNameWithExtension)}";

                var isOldVideo = image.Url.Contains("/video/upload/", StringComparison.OrdinalIgnoreCase) ||
                                 image.Url.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase) ||
                                 image.Url.EndsWith(".webm", StringComparison.OrdinalIgnoreCase) ||
                                 image.Url.EndsWith(".mov", StringComparison.OrdinalIgnoreCase) ||
                                 image.Url.EndsWith(".m4v", StringComparison.OrdinalIgnoreCase);

                await _cloudinaryService.DeleteMediaAsync(publicId, isOldVideo);

                // Upload new media to Cloudinary (handles image or video)
                var newUrl = await _cloudinaryService.UploadMediaAsync(file, "RentFlow");

                // Update the EXISTING database row with the new URL
                image.Url = newUrl;
                _context.PropertyImages.Update(image);
                await _context.SaveChangesAsync();

                return Ok(new { Url = newUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
    }

    public class CreatePropertyDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Location { get; set; } = string.Empty;
        public int Beds { get; set; }
        public int Baths { get; set; }
        public int Sqft { get; set; }
        public string PropertyType { get; set; } = string.Empty;
        public List<string> Amenities { get; set; } = new List<string>();
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = "Available";
    }
}
