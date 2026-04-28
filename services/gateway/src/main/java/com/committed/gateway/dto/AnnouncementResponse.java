package com.committed.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponse {
    private Integer announcementId;
    private UserSummary postedBy;
    private Integer courseId;
    private String title;
    private String content;
    private String postedAt;
    private String updatedAt;
    private List<AttachmentResponse> attachments;
}