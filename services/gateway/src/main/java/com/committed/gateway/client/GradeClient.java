package com.committed.gateway.client;

import com.committed.gateway.dto.GradeDto;
import com.committed.gateway.dto.GradeRequest;
import com.committed.gateway.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class GradeClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${core.service.url}")
    private String coreServiceUrl;

    public GradeDto createGrade(Integer submissionId, Long userId, String userRole, GradeRequest request) {
        String url = coreServiceUrl + "/internal/submissions/" + submissionId + "/grade";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-User-Id", String.valueOf(userId));
        headers.set("X-User-Role", userRole);

        HttpEntity<GradeRequest> requestEntity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<GradeDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    GradeDto.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Failed to create grade: {}", e.getResponseBodyAsString());
            handleCommonExceptions(e);
            throw new RuntimeException("Failed to create grade: " + e.getResponseBodyAsString());
        }
    }

    public GradeDto updateGrade(Integer gradeId, Long userId, String userRole, GradeRequest request) {
        String url = coreServiceUrl + "/internal/grades/" + gradeId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-User-Id", String.valueOf(userId));
        headers.set("X-User-Role", userRole);

        HttpEntity<GradeRequest> requestEntity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<GradeDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    requestEntity,
                    GradeDto.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Failed to update grade: {}", e.getResponseBodyAsString());
            handleCommonExceptions(e);
            throw new RuntimeException("Failed to update grade: " + e.getResponseBodyAsString());
        }
    }

    public GradeDto getGrade(Integer submissionId, Long userId, String userRole) {
        String url = coreServiceUrl + "/internal/submissions/" + submissionId + "/grade";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", String.valueOf(userId));
        headers.set("X-User-Role", userRole);

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<GradeDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    requestEntity,
                    GradeDto.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch grade: {}", e.getResponseBodyAsString());
            handleCommonExceptions(e);
            throw new RuntimeException("Failed to fetch grade");
        }
    }

    public GradeDto getGradeById(Integer gradeId, Long userId, String userRole) {
        String url = coreServiceUrl + "/internal/grades/" + gradeId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", String.valueOf(userId));
        headers.set("X-User-Role", userRole);

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<GradeDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    requestEntity,
                    GradeDto.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch grade by id: {}", e.getResponseBodyAsString());
            handleCommonExceptions(e);
            throw new RuntimeException("Failed to fetch grade by id");
        }
    }

    private void handleCommonExceptions(HttpClientErrorException e) {
        String errorMessage = extractErrorMessage(e);
        if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
            throw new ResourceNotFoundException(errorMessage);
        } else if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
            throw new AccessDeniedException(errorMessage);
        } else if (e.getStatusCode() == HttpStatus.CONFLICT) {
            throw new IllegalStateException(errorMessage);
        } else if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    private String extractErrorMessage(HttpClientErrorException e) {
        try {
            JsonNode root = objectMapper.readTree(e.getResponseBodyAsString());
            if (root.has("error")) {
                return root.get("error").asText();
            }
        } catch (Exception ex) {
            // Ignore parse errors
        }
        return "An error occurred";
    }
}