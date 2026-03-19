package com.committed.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {
    private Integer attachmentId;
    private Integer announcementId;
    private String fileName;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private UserSummary uploadedBy;
    private String uploadedAt;
}