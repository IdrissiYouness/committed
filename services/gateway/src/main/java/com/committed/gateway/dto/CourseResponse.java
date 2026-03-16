package com.committed.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private Integer courseId;
    private String courseCode;
    private String courseName;
    private String description;
    private String section;
    private String subject;
    private Boolean isOpen;
    private Boolean isActive;
    private UserProfileResponse teacher;
    private String createdAt;
    private String updatedAt;
}