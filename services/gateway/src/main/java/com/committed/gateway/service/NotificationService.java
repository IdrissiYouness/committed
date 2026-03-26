package com.committed.gateway.service;

public interface NotificationService {
    void notifyNewAnnouncement(Long courseId, String title);

    void notifyGradeUpdate(Integer submissionId, java.math.BigDecimal pointsEarned);
}