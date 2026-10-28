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
    public class ApplicationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public ApplicationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> ApplyForProperty([FromBody] CreateApplicationDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

            var application = new Application
            {
                PropertyId = dto.PropertyId,
                ApplicantId = userId,
                Status = "Pending"
            };

            _context.Applications.Add(application);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Application submitted successfully." });
        }

        [HttpGet("my-applications")]
        public async Task<IActionResult> GetMyApplications()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

            var applications = await _context.Applications
                .Include(a => a.Property)
                .Where(a => a.ApplicantId == userId)
                .ToListAsync();

            return Ok(applications);
        }
    }

    public class CreateApplicationDto
    {
        public int PropertyId { get; set; }
    }
}
