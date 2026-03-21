package com.committed.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Integer commentId;
    private Integer announcementId;
    private UserSummary user;
    private Integer parentCommentId;
    private String content;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
}