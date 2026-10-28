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
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly RentFlow.API.Services.ICloudinaryService _cloudinaryService;

        public ChatController(ApplicationDbContext context, RentFlow.API.Services.ICloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            // Find all unique users the current user has chatted with
            var conversations = await _context.ChatMessages
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g => new
                {
                    ContactId = g.Key,
                    LatestMessage = g.OrderByDescending(m => m.Timestamp).FirstOrDefault(),
                    UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
                })
                .ToListAsync();

            // Get contact details for these conversations
            var contactIds = conversations.Select(c => c.ContactId).ToList();
            var contacts = await _context.Users
                .Where(u => contactIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Name, u.ProfilePictureUrl })
                .ToListAsync();

            var result = conversations.Select(c =>
            {
                var contact = contacts.FirstOrDefault(u => u.Id == c.ContactId);
                return new
                {
                    ContactId = c.ContactId,
                    ContactName = contact?.Name ?? "Unknown User",
                    ContactAvatar = contact?.ProfilePictureUrl,
                    LatestMessage = c.LatestMessage,
                    UnreadCount = c.UnreadCount
                };
            }).OrderByDescending(c => c.LatestMessage?.Timestamp).ToList();

            return Ok(result);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadChatAttachment(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            try
            {
                var url = await _cloudinaryService.UploadMediaAsync(file, "RentFlow_Chat");
                return Ok(new { Url = url, FileName = file.FileName, ContentType = file.ContentType });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Failed to upload attachment: " + ex.Message);
            }
        }

        [HttpGet("history/{contactId}")]
        public async Task<IActionResult> GetHistory(Guid contactId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var messages = await _context.ChatMessages
                .Where(m => (m.SenderId == userId && m.ReceiverId == contactId) ||
                            (m.SenderId == contactId && m.ReceiverId == userId))
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            // Mark unread messages as read since the user is viewing the history
            var unreadMessages = messages.Where(m => m.ReceiverId == userId && !m.IsRead).ToList();
            if (unreadMessages.Any())
            {
                foreach (var msg in unreadMessages)
                {
                    msg.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }

            return Ok(messages);
        }
    }
}
