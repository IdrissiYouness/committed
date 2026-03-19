package com.committed.gateway.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MockNotificationService implements NotificationService {

    @Async("taskExecutor")
    @Override
    public void notifyNewAnnouncement(Long courseId, String title) {
        log.info("[NOTIFICATION MOCK] Sending email to all students enrolled in course {} about new announcement: {}", courseId, title);
    }
}