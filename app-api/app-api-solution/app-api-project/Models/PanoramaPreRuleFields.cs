namespace app_api_project.Models
{
    public class PanoramaPreRuleFields
    {
        public string RuleName { get; set; } = string.Empty; //Implemented
        public string TicketNumber { get; set; } = string.Empty; //Implemented 
        public string ProfileSetting { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty; //Implemented
        public string From { get; set; } = string.Empty; //Implemented
        public string Source { get; set; } = string.Empty; //Implemented
        public string Destination { get; set; } = string.Empty; //Implemented
        public string Application { get; set; } = string.Empty;
        public string Service { get; set; } = string.Empty;
        public string GroupTag { get; set; } = string.Empty; //Implemented
        public string Tag { get; set; } = string.Empty; //Implemented
        public string Action { get; set; } = string.Empty; //Implemented
        public string LogSetting { get; set; } = string.Empty; //Implemented
        public string LogStart { get; set; } = string.Empty; //Implemented
        public string LogEnd { get; set; } = string.Empty; //Implemented
        public string Description { get; set; } = string.Empty; //Implemented
        public string DeviceGroup { get; set; } = string.Empty; //Implemented
        public string Before { get; set; } = string.Empty;
    }
}
