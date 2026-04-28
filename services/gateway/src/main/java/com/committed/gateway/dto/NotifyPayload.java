package com.committed.gateway.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotifyPayload {
    private String type;
    private String recipientEmail;
    private String recipientName;

    // Course context
    private String courseName;

    // Announcement
    private String announcementTitle;
    private String announcementContent;
    private String professorName;

    // Assignment
    private String assignmentTitle;
    private String dueDate;

    // Grade
    private Double pointsEarned;
    private Double maxPoints;
    private String feedback;
    private String gradeSource;

    // Analysis
    private String analysisScore;
    private String failureReason;
}
