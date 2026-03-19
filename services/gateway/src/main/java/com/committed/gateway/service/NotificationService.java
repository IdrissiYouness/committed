package com.committed.gateway.service;

public interface NotificationService {
    void notifyNewAnnouncement(Long courseId, String title);
}