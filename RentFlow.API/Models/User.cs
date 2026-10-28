namespace RentFlow.API.Models
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        
        public string? ProfilePictureUrl { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        
        // Premium & Subscription
        public bool IsPremium { get; set; } = false;
        public string? SubscriptionPlan { get; set; }
        public DateTime? SubscriptionExpiresAt { get; set; }
        
        // Navigation Properties
        public ICollection<Property> Properties { get; set; } = new List<Property>();
        public ICollection<Application> Applications { get; set; } = new List<Application>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
