namespace RentFlow.API.Models
{
    public class PropertyImage
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string Url { get; set; } = string.Empty;

        // Navigation property
        public Property? Property { get; set; }
    }
}
