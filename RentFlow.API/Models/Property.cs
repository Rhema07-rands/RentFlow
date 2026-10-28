namespace RentFlow.API.Models
{
    public class Property
    {
        public int Id { get; set; }
        public Guid OwnerId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Location { get; set; } = string.Empty;
        public string Status { get; set; } = "Available"; // Available, Rented
        
        // Advanced Filters
        public int Beds { get; set; }
        public int Baths { get; set; }
        public int Sqft { get; set; }
        public string PropertyType { get; set; } = string.Empty;
        public string Amenities { get; set; } = string.Empty;
        public int Views { get; set; } = 0;
        
        // Navigation Properties
        public User? Owner { get; set; } = null;
        public ICollection<Application> Applications { get; set; } = new List<Application>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public ICollection<PropertyImage> Images { get; set; } = new List<PropertyImage>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
