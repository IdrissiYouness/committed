package com.committed.gateway.dto.assignment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class AssignmentRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title cannot exceed 500 characters")
    private String title;

    private String description;

    private BigDecimal maxPoints;

    private OffsetDateTime dueDate;

    private Boolean allowLateSubmission;

    private Boolean requireGithubRepo;

    private List<AssignmentAttachmentDto> attachments;
}