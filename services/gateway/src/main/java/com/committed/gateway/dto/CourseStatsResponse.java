package com.committed.gateway.dto;

import java.util.List;

public class CourseStatsResponse {
    
    private Integer totalStudents;
    private Double averageGrade;
    private Double completionRate;
    private List<Object> recentActivity;
    
    public CourseStatsResponse() {
    }

    public CourseStatsResponse(Integer totalStudents, Double averageGrade, Double completionRate, List<Object> recentActivity) {
        this.totalStudents = totalStudents;
        this.averageGrade = averageGrade;
        this.completionRate = completionRate;
        this.recentActivity = recentActivity;
    }

    public Integer getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(Integer totalStudents) {
        this.totalStudents = totalStudents;
    }

    public Double getAverageGrade() {
        return averageGrade;
    }

    public void setAverageGrade(Double averageGrade) {
        this.averageGrade = averageGrade;
    }

    public Double getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(Double completionRate) {
        this.completionRate = completionRate;
    }

    public List<Object> getRecentActivity() {
        return recentActivity;
    }

    public void setRecentActivity(List<Object> recentActivity) {
        this.recentActivity = recentActivity;
    }
}