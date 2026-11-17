using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RentFlow.API.Data;
using RentFlow.API.Models;
using System.Security.Claims;

namespace RentFlow.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out Guid userId))
            {
                // Add the connection to a group named after their user ID in lowercase
                await Groups.AddToGroupAsync(Context.ConnectionId, userId.ToString().ToLower());
            }

            await base.OnConnectedAsync();
        }

        public async Task SendMessage(string receiverIdStr, string content, string messageType = "text", string? contactName = null)
        {
            var senderIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(senderIdStr, out Guid senderId)) return;
            if (!Guid.TryParse(receiverIdStr, out Guid receiverId)) return;

            // Ensure receiver user exists in database to prevent FK constraint failure
            var receiverUser = await _context.Users.FindAsync(receiverId);
            if (receiverUser == null)
            {
                // Auto-create stub user profile if chatting with mock landlord or unseeded account
                receiverUser = new User
                {
                    Id = receiverId,
                    Name = !string.IsNullOrWhiteSpace(contactName) ? contactName.Trim() : "RentFlow Contact",
                    Email = $"contact_{receiverId.ToString().Substring(0, 8)}@rentflow.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("MockOwnerPass123!"),
                };
                _context.Users.Add(receiverUser);
                await _context.SaveChangesAsync();
            }
            else if (!string.IsNullOrWhiteSpace(contactName) &&
                     (receiverUser.Name == "Property Owner" || receiverUser.Name == "Unknown User" || string.IsNullOrWhiteSpace(receiverUser.Name)))
            {
                // Update generic/stub name to the contact's actual name
                receiverUser.Name = contactName.Trim();
                _context.Users.Update(receiverUser);
                await _context.SaveChangesAsync();
            }

            var senderUser = await _context.Users.FindAsync(senderId);
            var senderName = senderUser?.Name ?? "RentFlow User";
            var senderAvatar = senderUser?.ProfilePictureUrl;

            // 1. Save to DB
            var message = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content,
                MessageType = messageType,
                Timestamp = DateTime.UtcNow,
                IsRead = false,
                SenderName = senderName,
                SenderAvatar = senderAvatar
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            var receiverGroupId = receiverId.ToString().ToLower();
            var senderGroupId = senderId.ToString().ToLower();

            // 2. Forward to receiver's group
            await Clients.Group(receiverGroupId).SendAsync("ReceiveMessage", message, senderName, senderAvatar);
            
            // Also send back to sender's group to confirm it was sent (if different group)
            if (senderGroupId != receiverGroupId)
            {
                await Clients.Group(senderGroupId).SendAsync("ReceiveMessage", message, senderName, senderAvatar);
            }
        }
    }
}
