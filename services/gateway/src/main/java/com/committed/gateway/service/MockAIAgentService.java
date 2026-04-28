package com.committed.gateway.service;

import com.committed.gateway.client.SubmissionClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class MockAIAgentService {

    private final SubmissionClient submissionClient;
    // In a real system we would inject NotificationService to notify the specific user directly.
    // However, existing MockNotificationService mostly targets courseId. We will log the notification.

    public void triggerAsyncAnalysis(Integer submissionId, String githubUrl) {
        log.info("Triggered async Mock AI analysis for submission {} with repo {}", submissionId, githubUrl);

        // Run the delay and callbacks in a background thread to unblock the current request (201 Created)
        CompletableFuture.runAsync(() -> {
            try {
                // 1. Tell Core that the analysis is now 'pending'
                submissionClient.saveAnalysisResult(submissionId, "pending", null, null);

                // 2. Simulate AI processing time
                log.info("Mock AI Agent is processing submission {}...", submissionId);
                Thread.sleep(5000); 

                // 3. Send final results back to Core
                String mockMetrics = "{\"complexity\": \"A\", \"bugs\": 0, \"coverage\": \"95%\"}";
                String mockPdfUrl = "https://storage.committed.local/reports/report-" + submissionId + ".pdf";
                
                submissionClient.saveAnalysisResult(submissionId, "completed", mockMetrics, mockPdfUrl);

                log.info("Mock AI analysis complete for submission {}. Data saved to Core.", submissionId);

                // 4. (Orchestrator Step) Notify student via NotificationService
                log.info("Notification sent: 'Your AI code analysis is ready for submission {}'", submissionId);

            } catch (Exception e) {
                log.error("Failed to execute async Mock AI analysis for submission {}", submissionId, e);
                try {
                    submissionClient.saveAnalysisResult(submissionId, "failed", null, null);
                } catch (Exception updateEx) {
                    log.error("Failed to mark analysis as failed for submission {}", submissionId, updateEx);
                }
            }
        });
    }
}
