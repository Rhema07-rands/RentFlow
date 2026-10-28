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
                // Add the connection to a group named after their user ID
                await Groups.AddToGroupAsync(Context.ConnectionId, userId.ToString());
            }

            await base.OnConnectedAsync();
        }

        public async Task SendMessage(string receiverIdStr, string content, string messageType = "text")
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
                    Name = "Property Owner",
                    Email = $"owner_{receiverId.ToString().Substring(0, 8)}@rentflow.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("MockOwnerPass123!"),
                };
                _context.Users.Add(receiverUser);
                await _context.SaveChangesAsync();
            }

            // 1. Save to DB
            var message = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content,
                MessageType = messageType,
                Timestamp = DateTime.UtcNow,
                IsRead = false
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            // 2. Forward to receiver's group
            await Clients.Group(receiverId.ToString()).SendAsync("ReceiveMessage", message);
            
            // Also send back to sender's group to confirm it was sent
            await Clients.Group(senderId.ToString()).SendAsync("ReceiveMessage", message);
        }
    }
}
