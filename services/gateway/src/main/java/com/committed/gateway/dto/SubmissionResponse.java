package com.committed.gateway.dto;

import lombok.Data;
import java.util.List;

@Data
public class SubmissionResponse {
    private Integer submissionId;
    private Integer assignmentId;
    private Integer studentId;
    private String submissionText;
    private String githubRepoUrl;
    private String status;
    private String submittedAt;
    private String updatedAt;
    private List<SubmissionAttachmentResponse> attachments;
    private CodeAnalysisResponse codeAnalysis;
}
