package com.committed.gateway.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeAnalyzerClient {

    private final RestTemplate restTemplate;

    @Value("${analyzer.service.url}")
    private String analyzerServiceUrl;

    /**
     * POST /analyze to the code-analyzer service.
     * Returns immediately with 202 — result is delivered via webhook callback.
     */
    public void triggerAnalysis(Integer submissionId, String repoUrl, Integer studentId) {
        String url = analyzerServiceUrl + "/analyze";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("submissionId", submissionId);
        body.put("repoUrl", repoUrl);
        body.put("studentId", studentId);
        body.put("callbackUrl", "http://gateway:8080/internal/analysis-result");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Void> response = restTemplate.exchange(url, HttpMethod.POST, request, Void.class);
            if (response.getStatusCode() == HttpStatus.ACCEPTED) {
                log.info("[{}] analysis job accepted by code-analyzer", submissionId);
            } else if (response.getStatusCode() == HttpStatus.CONFLICT) {
                log.warn("[{}] analysis already in progress, skipping", submissionId);
            }
        } catch (Exception e) {
            log.error("[{}] failed to trigger code-analyzer: {}", submissionId, e.getMessage());
            throw new RuntimeException("Failed to reach code-analyzer service", e);
        }
    }
}
