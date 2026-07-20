public class CreatePreRuleRequest
{
    public string RuleName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DeviceGroup { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public List<string> Application { get; set; } = new();
    public List<string> Service { get; set; } = new();
    public List<string> Tag { get; set; } = new();
    public string GroupTag { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string LogSetting { get; set; } = string.Empty;
    public string LogStart { get; set; } = string.Empty;
    public string LogEnd { get; set; } = string.Empty;
    public string ProfileSetting { get; set; } = string.Empty;
    public string Requester { get; set; } = string.Empty;
    public string TicketNumber { get; set; } = string.Empty;
    public string SourceName { get; set; } = string.Empty;
    public string DestinationName { get; set; } = string.Empty;
}