package com.committed.gateway.service;

import com.committed.gateway.dto.GradeDto;

public interface NotificationService {

    void notifyAnnouncementCreated(Long courseId, String title, String content, Long professorId);

    void notifyAssignmentCreated(Long courseId, String assignmentTitle, String dueDate, Long professorId);

    void notifyGradeCreated(Integer submissionId, GradeDto grade);

    void notifyGradeValidated(Integer submissionId, GradeDto grade);

    void notifyAnalysisCompleted(Integer submissionId, int percentage, String reportUrl);

    void notifyAnalysisFailed(Integer submissionId, String failureReason);
}
