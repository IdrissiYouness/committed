package com.committed.gateway.client;

import com.committed.gateway.dto.PagedResponse;
import com.committed.gateway.dto.SubmissionResponse;
import com.committed.gateway.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionClient {

    private final RestTemplate restTemplate;

    @Value("${core.service.url}")
    private String coreServiceUrl;

    public SubmissionResponse createSubmission(Integer assignmentId, Long userId, String userRole, String submissionText, String githubRepoUrl, List<MultipartFile> files) {
        String url = coreServiceUrl + "/internal/assignments/" + assignmentId + "/submissions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-User-Id", String.valueOf(userId));
        headers.set("X-User-Role", userRole);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        if (submissionText != null) body.add("submissionText", submissionText);
        if (githubRepoUrl != null) body.add("githubRepoUrl", githubRepoUrl);

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    try {
                        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                            @Override
                            public String getFilename() {
                                return file.getOriginalFilename();
                            }
                        };
                        body.add("files[]", resource);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to read file attachment", e);
                    }
                }
            }
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<SubmissionResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    SubmissionResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Failed to create submission: {}", e.getResponseBodyAsString());
            handleCommonExceptions(e);
            throw new RuntimeException("Failed to create submission: " + e.getResponseBodyAsString());
        }
    }

    public SubmissionResponse updateSubmission(Integer id, Long userId, String userRole, String submissionText, String githubRepoUrl, List<MultipartFile> files, List<Integer> removeAttachmentIds) {
        String url = coreServiceUrl + "/internal/submissions/" + id;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-User-Id", String.valueOf(userId));
        headers.set("X-User-Role", userRole);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        if (submissionText != null) body.add("submissionText", submissionText);
        if (githubRepoUrl != null) body.add("githubRepoUrl", githubRepoUrl);

        if (removeAttachmentIds != null && !removeAttachmentIds.isEmpty()) {
            for (Integer attachmentId : removeAttachmentIds) {
                body.add("removeAttachmentIds[]", attachmentId);
            }
        }

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    try {
                        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                            @Override
                            public String getFilename() {
                                return file.getOriginalFilename();
                            }
                        };
                        body.add("files[]", resource);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to read file attachment", e);
                    }
                }
            }
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<SubmissionResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    SubmissionResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Failed to update submission: {}", e.getResponseBodyAsString());
            handleCommonExceptions(e);
            throw new RuntimeException("Failed to update submission: " + e.getResponseBodyAsString());
        }
    }

    public PagedResponse<SubmissionResponse> getSubmissions(Integer assignmentId, int page, int size) {
        String url = coreServiceUrl + "/internal/assignments/" + assignmentId + "/submissions?page=" + page + "&size=" + size;

        try {
            ResponseEntity<PagedResponse<SubmissionResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<PagedResponse<SubmissionResponse>>() {}
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch submissions: {}", e.getResponseBodyAsString());
            handleCommonExceptions(e);
            throw new RuntimeException("Failed to fetch submissions");
        }
    }

    public SubmissionResponse getSubmission(Integer id, Long userId, String userRole) {
        String url = coreServiceUrl + "/internal/submissions/" + id;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", String.valueOf(userId));
        headers.set("X-User-Role", userRole);

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<SubmissionResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    requestEntity,
                    SubmissionResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch submission: {}", e.getResponseBodyAsString());
            handleCommonExceptions(e);
            throw new RuntimeException("Failed to fetch submission");
        }
    }

    public void saveAnalysisResult(Integer submissionId, String status, String metricsData, String reportPdfUrl) {
        String url = coreServiceUrl + "/internal/submissions/" + submissionId + "/analysis";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("status", status);
        if (metricsData != null) body.put("metricsData", metricsData);
        if (reportPdfUrl != null) body.put("reportPdfUrl", reportPdfUrl);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    Void.class
            );
        } catch (HttpClientErrorException e) {
            log.error("Failed to save analysis result: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Failed to save analysis result: " + e.getResponseBodyAsString());
        }
    }

    private void handleCommonExceptions(HttpClientErrorException e) {
        if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
            throw new ResourceNotFoundException("Resource not found");
        } else if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
            throw new AccessDeniedException(extractErrorMessage(e));
        } else if (e.getStatusCode() == HttpStatus.CONFLICT) {
            throw new IllegalStateException("Conflict: A submission already exists.");
        } else if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
            throw new IllegalArgumentException("Bad request: " + e.getResponseBodyAsString());
        }
    }
    private String extractErrorMessage(HttpClientErrorException e) {
        try {
            com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
            if (root.has("error")) {
                return root.get("error").asText();
            }
        } catch (Exception ex) {
            // Ignore parse errors
        }
        return "Access denied to this resource";
    }
}
