package com.committed.gateway.dto;

import lombok.Data;

@Data
public class SubmissionAttachmentResponse {
    private Integer attachmentId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String filePath;
    private String uploadedAt;
}
