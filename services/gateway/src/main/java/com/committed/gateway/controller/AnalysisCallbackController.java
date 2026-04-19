package com.committed.gateway.controller;

import com.committed.gateway.client.SubmissionClient;
import com.committed.gateway.dto.internal.AnalysisCallbackRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
@Slf4j
public class AnalysisCallbackController {

    private final SubmissionClient submissionClient;
    private final ObjectMapper objectMapper;

    @PostMapping("/analysis-result")
    public ResponseEntity<Void> receiveAnalysisResult(@RequestBody AnalysisCallbackRequest payload) {
        Integer submissionId = payload.getSubmissionId();
        log.info("[{}] received analysis callback — status={} grade={}", submissionId, payload.getStatus(), payload.getGrade());

        try {
            String metricsJson = objectMapper.writeValueAsString(buildMetrics(payload));
            String reportPdfUrl = resolveReportUrl(payload.getReportUrl());

            submissionClient.saveAnalysisResult(submissionId, payload.getStatus(), metricsJson, reportPdfUrl);
            log.info("[{}] analysis result saved to Core", submissionId);
        } catch (Exception e) {
            log.error("[{}] failed to persist analysis result: {}", submissionId, e.getMessage());
            try {
                submissionClient.saveAnalysisResult(submissionId, "failed", null, null);
            } catch (Exception ex) {
                log.error("[{}] failed to mark as failed after callback error: {}", submissionId, ex.getMessage());
            }
        }

        return ResponseEntity.ok().build();
    }

    private java.util.Map<String, Object> buildMetrics(AnalysisCallbackRequest payload) {
        java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();

        // Legacy keys — consumed by existing CodeAnalysisPanel
        m.put("complexity", payload.getGrade());
        m.put("bugs", countIssues(payload));
        m.put("coverage", formatCoverage(payload));

        // Rich keys — available for future frontend improvements
        m.put("grade", payload.getGrade());
        m.put("percentage", payload.getPercentage());
        m.put("studentLevel", payload.getStudentLevel());
        m.put("breakdown", payload.getBreakdown());
        m.put("metrics", payload.getMetrics());
        m.put("analyzedAt", payload.getAnalyzedAt());
        m.put("analyzedIn", payload.getAnalyzedIn());

        return m;
    }

    private int countIssues(AnalysisCallbackRequest payload) {
        if (payload.getMetrics() == null) return 0;
        try {
            Object perFile = payload.getMetrics().get("per_file");
            if (perFile instanceof java.util.List<?> files) {
                return files.stream()
                        .filter(f -> f instanceof java.util.Map)
                        .mapToInt(f -> {
                            Object issues = ((java.util.Map<?, ?>) f).get("issues");
                            return issues instanceof java.util.List<?> list ? list.size() : 0;
                        })
                        .sum();
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private String formatCoverage(AnalysisCallbackRequest payload) {
        if (payload.getBreakdown() == null) return "0%";
        try {
            Object testing = payload.getBreakdown().get("testing");
            if (testing instanceof java.util.Map<?, ?> map) {
                Object score = map.get("score");
                if (score instanceof Number n) {
                    return (int) Math.round(n.doubleValue() * 20) + "%";
                }
            }
        } catch (Exception ignored) {}
        return "0%";
    }

    private String resolveReportUrl(String reportUrl) {
        if (reportUrl == null || reportUrl.isBlank()) return null;
        // Store as a gateway-relative path so the browser fetches via the gateway
        // (e.g. /reports/123.pdf → /api/reports/123.pdf) — avoids exposing the
        // internal code-analyzer:5000 URL to the frontend.
        String filename = reportUrl.replaceAll(".*/", "");
        return "/api/reports/" + filename;
    }
}
