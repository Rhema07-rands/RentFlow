namespace RentFlow.API.Models
{
    public class Review
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public Guid ReviewerId { get; set; }
        public int Rating { get; set; } // 1 to 5 stars
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Property? Property { get; set; }
        public User? Reviewer { get; set; }
    }
}
