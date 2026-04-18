package com.committed.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeDto {
    private Integer gradeId;
    private Integer submissionId;
    private GraderDto gradedBy;
    private BigDecimal pointsEarned;
    private BigDecimal maxPoints;
    private String feedback;
    private String gradedAt;
    private Integer assignmentId;
    private String assignmentTitle;
    private Integer courseId;
    private String courseName;
    private String courseCode;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GraderDto {
        private Long userId;
        private String fullName;
        private String email;
    }
}