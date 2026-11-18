using System.ComponentModel.DataAnnotations.Schema;

namespace RentFlow.API.Models
{
    public class ChatMessage
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string MessageType { get; set; } = "text";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
        public bool IsDelivered { get; set; } = false;

        [NotMapped]
        public string? SenderName { get; set; }

        [NotMapped]
        public string? SenderAvatar { get; set; }

        // Navigation Properties (Optional but good for relationships)
        public User? Sender { get; set; }
        public User? Receiver { get; set; }
    }
}
