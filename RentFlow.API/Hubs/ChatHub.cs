using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RentFlow.API.Data;
using RentFlow.API.Models;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace RentFlow.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;

        // Track online users: userId -> set of connectionIds (a user may have multiple tabs/devices)
        private static readonly ConcurrentDictionary<string, HashSet<string>> _onlineUsers = new();

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>Returns true if the given userId is currently connected to the hub.</summary>
        public static bool IsUserOnline(string userId) =>
            _onlineUsers.ContainsKey(userId.ToLower());

        public override async Task OnConnectedAsync()
        {
            var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out Guid userId))
            {
                var key = userId.ToString().ToLower();

                // Add to SignalR group
                await Groups.AddToGroupAsync(Context.ConnectionId, key);

                // Track this connection
                _onlineUsers.AddOrUpdate(
                    key,
                    _ => new HashSet<string> { Context.ConnectionId },
                    (_, set) => { lock (set) { set.Add(Context.ConnectionId); } return set; }
                );

                // Broadcast UserOnline to all clients (they'll filter locally for their contacts)
                await Clients.Others.SendAsync("UserOnline", key);

                // Deliver any messages that were sent while this user was offline
                // (mark them as delivered and notify senders)
                var undeliveredMessages = await _context.ChatMessages
                    .Where(m => m.ReceiverId == userId && !m.IsDelivered && !m.IsRead)
                    .ToListAsync();

                if (undeliveredMessages.Any())
                {
                    var senderIds = new HashSet<string>();
                    foreach (var msg in undeliveredMessages)
                    {
                        msg.IsDelivered = true;
                        senderIds.Add(msg.SenderId.ToString().ToLower());
                    }
                    await _context.SaveChangesAsync();

                    // Notify each sender that their messages were delivered
                    foreach (var senderId in senderIds)
                    {
                        var deliveredMsgIds = undeliveredMessages
                            .Where(m => m.SenderId.ToString().ToLower() == senderId)
                            .Select(m => m.Id.ToString())
                            .ToList();

                        await Clients.Group(senderId).SendAsync("MessageDelivered", deliveredMsgIds);
                    }
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out Guid userId))
            {
                var key = userId.ToString().ToLower();

                if (_onlineUsers.TryGetValue(key, out var connections))
                {
                    lock (connections)
                    {
                        connections.Remove(Context.ConnectionId);
                    }

                    // Only broadcast offline if no connections remain
                    if (connections.Count == 0)
                    {
                        _onlineUsers.TryRemove(key, out _);
                        await Clients.Others.SendAsync("UserOffline", key);
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
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
                receiverUser.Name = contactName.Trim();
                _context.Users.Update(receiverUser);
                await _context.SaveChangesAsync();
            }

            var senderUser = await _context.Users.FindAsync(senderId);
            var senderName = senderUser?.Name ?? "RentFlow User";
            var senderAvatar = senderUser?.ProfilePictureUrl;

            // Check if receiver is online RIGHT NOW
            var receiverKey = receiverId.ToString().ToLower();
            var isReceiverOnline = IsUserOnline(receiverKey);

            // 1. Save to DB
            var message = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content,
                MessageType = messageType,
                Timestamp = DateTime.UtcNow,
                IsRead = false,
                IsDelivered = isReceiverOnline, // delivered immediately if receiver is online
                SenderName = senderName,
                SenderAvatar = senderAvatar
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            var senderGroupId = senderId.ToString().ToLower();

            // 2. Forward to receiver's group
            await Clients.Group(receiverKey).SendAsync("ReceiveMessage", message, senderName, senderAvatar);

            // Also send back to sender's group to confirm it was sent
            if (senderGroupId != receiverKey)
            {
                await Clients.Group(senderGroupId).SendAsync("ReceiveMessage", message, senderName, senderAvatar);
            }

            // 3. If receiver is online, notify sender that message was delivered
            if (isReceiverOnline)
            {
                await Clients.Group(senderGroupId).SendAsync("MessageDelivered", new List<string> { message.Id.ToString() });
            }
        }

        /// <summary>
        /// Called by the client when the user opens a conversation.
        /// Marks all messages FROM contactId TO the current user as read,
        /// then notifies the contact so their UI updates the check marks to blue.
        /// </summary>
        public async Task MarkMessagesAsRead(string contactIdStr)
        {
            var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId)) return;
            if (!Guid.TryParse(contactIdStr, out Guid contactId)) return;

            // Find unread messages from contactId to this user
            var unreadMessages = await _context.ChatMessages
                .Where(m => m.SenderId == contactId && m.ReceiverId == userId && !m.IsRead)
                .ToListAsync();

            if (!unreadMessages.Any()) return;

            var messageIds = new List<string>();
            foreach (var msg in unreadMessages)
            {
                msg.IsRead = true;
                msg.IsDelivered = true; // also mark as delivered (it must be if it's read)
                messageIds.Add(msg.Id.ToString());
            }
            await _context.SaveChangesAsync();

            // Notify the contact (the original sender) so their check marks turn blue
            var contactGroupId = contactId.ToString().ToLower();
            await Clients.Group(contactGroupId).SendAsync("MessagesRead", messageIds);
        }

        /// <summary>
        /// Returns which of the given user IDs are currently online.
        /// Called by the client after connecting to populate initial online statuses.
        /// </summary>
        public Task<List<string>> GetOnlineUsers(List<string> userIds)
        {
            var online = userIds
                .Where(id => IsUserOnline(id.ToLower()))
                .Select(id => id.ToLower())
                .ToList();
            return Task.FromResult(online);
        }
    }
}
