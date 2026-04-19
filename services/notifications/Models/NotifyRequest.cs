namespace Notifications.Models;

public class NotifyRequest
{
    public string Type { get; set; } = "";
    public string RecipientEmail { get; set; } = "";
    public string RecipientName { get; set; } = "";

    // Course context
    public string? CourseName { get; set; }

    // Announcement fields
    public string? AnnouncementTitle { get; set; }
    public string? AnnouncementContent { get; set; }
    public string? ProfessorName { get; set; }

    // Assignment fields
    public string? AssignmentTitle { get; set; }
    public string? DueDate { get; set; }

    // Grade fields
    public double? PointsEarned { get; set; }
    public double? MaxPoints { get; set; }
    public string? Feedback { get; set; }
    public string? GradeSource { get; set; } // "ai" | "manual"

    // Analysis fields
    public string? ReportUrl { get; set; }
    public string? AnalysisScore { get; set; }
    public string? FailureReason { get; set; }
}
