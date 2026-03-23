package com.committed.gateway.dto.assignment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponse {
    private Long id;
    private Long courseId;
    private Long createdBy;
    private String title;
    private String description;
    private BigDecimal maxPoints;
    private OffsetDateTime dueDate;
    private boolean allowLateSubmission;
    private boolean requireGithubRepo;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<AssignmentAttachmentDto> attachments;
}