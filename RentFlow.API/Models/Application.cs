namespace RentFlow.API.Models
{
    public class Application
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public Guid ApplicantId { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        public Property? Property { get; set; }
        public User? Applicant { get; set; }
    }
}
