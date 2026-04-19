package com.committed.gateway.service;

import com.committed.gateway.client.CodeAnalyzerClient;
import com.committed.gateway.client.SubmissionClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeAnalyzerService {

    private final CodeAnalyzerClient codeAnalyzerClient;
    private final SubmissionClient submissionClient;

    /**
     * Mark the submission as pending in Core, then fire-and-forget to the
     * code-analyzer. The analyzer will POST the result back to
     * POST /internal/analysis-result when done.
     */
    public void triggerAsyncAnalysis(Integer submissionId, String repoUrl, Integer studentId) {
        log.info("[{}] triggering real code analysis for repo {}", submissionId, repoUrl);

        CompletableFuture.runAsync(() -> {
            try {
                submissionClient.saveAnalysisResult(submissionId, "pending", null, null);
                codeAnalyzerClient.triggerAnalysis(submissionId, repoUrl, studentId);
                submissionClient.saveAnalysisResult(submissionId, "analyzing", null, null);
            } catch (Exception e) {
                log.error("[{}] failed to trigger analysis: {}", submissionId, e.getMessage());
                try {
                    submissionClient.saveAnalysisResult(submissionId, "failed", null, null);
                } catch (Exception ex) {
                    log.error("[{}] failed to mark analysis as failed: {}", submissionId, ex.getMessage());
                }
            }
        });
    }
}
