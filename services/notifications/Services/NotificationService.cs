using Notifications.Models;

namespace Notifications.Services;

public class NotificationService
{
    private readonly IEmailService _email;
    private readonly ILogger<NotificationService> _logger;
    private readonly string _templatesPath;
    private readonly string _platformUrl;

    public NotificationService(IEmailService email, ILogger<NotificationService> logger, IWebHostEnvironment env, IConfiguration config)
    {
        _email = email;
        _logger = logger;
        _templatesPath = Path.Combine(env.ContentRootPath, "Templates");
        _platformUrl = config["Platform:Url"] ?? "http://localhost";
    }

    public async Task ProcessAsync(NotifyRequest req)
    {
        try
        {
            var (subject, html) = req.Type switch
            {
                "announcement.created" => BuildAnnouncement(req),
                "assignment.created"   => BuildAssignment(req),
                "grade.created"        => BuildGradeReceived(req),
                "grade.validated"      => BuildGradeValidated(req),
                "analysis.completed"   => BuildAnalysisComplete(req),
                "analysis.failed"      => BuildAnalysisFailed(req),
                _ => throw new InvalidOperationException($"Unknown notification type: {req.Type}")
            };

            await _email.SendAsync(req.RecipientEmail, req.RecipientName, subject, html);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification type={Type} to={Email}", req.Type, req.RecipientEmail);
        }
    }

    // ── builders ──────────────────────────────────────────────────────────────

    private (string subject, string html) BuildAnnouncement(NotifyRequest r)
    {
        var subject = $"[{r.CourseName}] New Announcement: {r.AnnouncementTitle}";
        var body = Render("NewAnnouncement.html", new Dictionary<string, string>
        {
            ["{{RecipientName}}"]       = r.RecipientName,
            ["{{CourseName}}"]          = r.CourseName ?? "",
            ["{{ProfessorName}}"]       = r.ProfessorName ?? "Your professor",
            ["{{AnnouncementTitle}}"]   = r.AnnouncementTitle ?? "",
            ["{{AnnouncementContent}}"] = r.AnnouncementContent ?? "",
        });
        return (subject, body);
    }

    private (string subject, string html) BuildAssignment(NotifyRequest r)
    {
        var subject = $"[{r.CourseName}] New Assignment: {r.AssignmentTitle}";
        var body = Render("NewAssignment.html", new Dictionary<string, string>
        {
            ["{{RecipientName}}"]   = r.RecipientName,
            ["{{CourseName}}"]      = r.CourseName ?? "",
            ["{{AssignmentTitle}}"] = r.AssignmentTitle ?? "",
            ["{{DueDate}}"]         = r.DueDate ?? "No due date set",
            ["{{ProfessorName}}"]   = r.ProfessorName ?? "Your professor",
        });
        return (subject, body);
    }

    private (string subject, string html) BuildGradeReceived(NotifyRequest r)
    {
        var subject = $"Your grade for \"{r.AssignmentTitle}\" is available";
        var sourceLabel = r.GradeSource == "ai" ? "AI-generated" : "manually graded";
        var body = Render("GradeReceived.html", new Dictionary<string, string>
        {
            ["{{RecipientName}}"]   = r.RecipientName,
            ["{{CourseName}}"]      = r.CourseName ?? "",
            ["{{AssignmentTitle}}"] = r.AssignmentTitle ?? "",
            ["{{PointsEarned}}"]    = r.PointsEarned?.ToString("0.##") ?? "-",
            ["{{MaxPoints}}"]       = r.MaxPoints?.ToString("0.##") ?? "-",
            ["{{GradeSource}}"]     = sourceLabel,
            ["{{Feedback}}"]        = string.IsNullOrWhiteSpace(r.Feedback)
                                        ? "<p style='color:#6b7280;'>No feedback was provided.</p>"
                                        : $"<p>{r.Feedback}</p>",
        });
        return (subject, body);
    }

    private (string subject, string html) BuildGradeValidated(NotifyRequest r)
    {
        var subject = $"Your grade for \"{r.AssignmentTitle}\" has been finalized";
        var body = Render("GradeReceived.html", new Dictionary<string, string>
        {
            ["{{RecipientName}}"]   = r.RecipientName,
            ["{{CourseName}}"]      = r.CourseName ?? "",
            ["{{AssignmentTitle}}"] = r.AssignmentTitle ?? "",
            ["{{PointsEarned}}"]    = r.PointsEarned?.ToString("0.##") ?? "-",
            ["{{MaxPoints}}"]       = r.MaxPoints?.ToString("0.##") ?? "-",
            ["{{GradeSource}}"]     = "validated by your professor",
            ["{{Feedback}}"]        = string.IsNullOrWhiteSpace(r.Feedback)
                                        ? "<p style='color:#6b7280;'>No feedback was provided.</p>"
                                        : $"<p>{r.Feedback}</p>",
        });
        return (subject, body);
    }

    private (string subject, string html) BuildAnalysisComplete(NotifyRequest r)
    {
        var subject = $"Code analysis ready for \"{r.AssignmentTitle}\"";
        var body = Render("AnalysisComplete.html", new Dictionary<string, string>
        {
            ["{{RecipientName}}"]   = r.RecipientName,
            ["{{CourseName}}"]      = r.CourseName ?? "",
            ["{{AssignmentTitle}}"] = r.AssignmentTitle ?? "",
            ["{{AnalysisScore}}"]   = r.AnalysisScore ?? "-",
        });
        return (subject, body);
    }

    private (string subject, string html) BuildAnalysisFailed(NotifyRequest r)
    {
        var subject = $"Code analysis could not complete for \"{r.AssignmentTitle}\"";
        var body = Render("AnalysisFailed.html", new Dictionary<string, string>
        {
            ["{{RecipientName}}"]   = r.RecipientName,
            ["{{CourseName}}"]      = r.CourseName ?? "",
            ["{{AssignmentTitle}}"] = r.AssignmentTitle ?? "",
            ["{{FailureReason}}"]   = r.FailureReason ?? "An unexpected error occurred.",
        });
        return (subject, body);
    }

    // ── template renderer ─────────────────────────────────────────────────────

    private string Render(string templateFile, Dictionary<string, string> tokens)
    {
        var layout = File.ReadAllText(Path.Combine(_templatesPath, "BaseLayout.html"));
        var content = File.ReadAllText(Path.Combine(_templatesPath, templateFile));

        foreach (var (key, value) in tokens)
            content = content.Replace(key, value);

        return layout.Replace("{{content}}", content);
    }
}
