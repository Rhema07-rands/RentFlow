namespace RentFlow.API.Models
{
    public class Payment
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public Guid TenantId { get; set; }
        public decimal AmountDue { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Paid, Overdue
        
        // Navigation Properties
        public Property? Property { get; set; }
        public User? Tenant { get; set; }
    }
}
