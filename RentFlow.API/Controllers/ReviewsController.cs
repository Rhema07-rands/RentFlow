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
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST /api/reviews — Submit a new review for a property
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            // Verify user is authenticated
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            //  Verify the property exists
            var property = await _context.Properties.FindAsync(dto.PropertyId);
            if (property == null)
                return NotFound("Property not found.");

            // Step 3: Check if user already reviewed this property (one review per property per user)
            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.PropertyId == dto.PropertyId && r.ReviewerId == userId);
            if (existingReview != null)
                return BadRequest("You have already reviewed this property.");

            // Step 4: Create and save the review
            var review = new Review
            {
                PropertyId = dto.PropertyId,
                ReviewerId = userId,
                Rating = Math.Clamp(dto.Rating, 1, 5), // Ensure rating is between 1 and 5
                Text = dto.Text,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Review submitted successfully." });
        }

        // GET /api/reviews/property/{propertyId} — Get all reviews for a specific property
        [HttpGet("property/{propertyId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPropertyReviews(int propertyId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.PropertyId == propertyId)
                .Include(r => r.Reviewer)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new {
                    r.Id,
                    r.Rating,
                    r.Text,
                    r.CreatedAt,
                    Reviewer = r.Reviewer != null ? new { r.Reviewer.Name, r.Reviewer.ProfilePictureUrl } : null
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // GET /api/reviews/my-reviews — Get all reviews written by the logged-in user
        [HttpGet("my-reviews")]
        public async Task<IActionResult> GetMyReviews()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var reviews = await _context.Reviews
                .Where(r => r.ReviewerId == userId)
                .Include(r => r.Property)
                    .ThenInclude(p => p!.Images)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new {
                    r.Id,
                    r.Rating,
                    r.Text,
                    r.CreatedAt,
                    Property = r.Property != null ? new {
                        r.Property.Id,
                        r.Property.Title,
                        r.Property.Location,
                        Image = r.Property.Images.Select(i => i.Url).FirstOrDefault()
                    } : null
                })
                .ToListAsync();

            return Ok(reviews);
        }
    }

    public class CreateReviewDto
    {
        public int PropertyId { get; set; }
        public int Rating { get; set; }
        public string Text { get; set; } = string.Empty;
    }
}
