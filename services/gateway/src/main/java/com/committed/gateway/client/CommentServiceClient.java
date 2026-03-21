package com.committed.gateway.client;

import com.committed.gateway.dto.CommentResponse;
import com.committed.gateway.dto.CreateCommentRequest;
import com.committed.gateway.dto.PaginatedResponse;
import com.committed.gateway.dto.UpdateCommentRequest;
import com.committed.gateway.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceClient {

    private final RestTemplate restTemplate;

    @Value("${core.service.url}")
    private String coreServiceUrl;

    public CommentResponse createComment(Integer announcementId, Long userId, CreateCommentRequest request) {
        String url = coreServiceUrl + "/internal/announcements/" + announcementId + "/comments";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-User-Id", String.valueOf(userId));

        HttpEntity<CreateCommentRequest> requestEntity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<CommentResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    CommentResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            String errorMessage = "Announcement or User not found (Core 404)";
            try {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
                if (root.has("error")) {
                    errorMessage = root.get("error").asText();
                }
            } catch (Exception parseEx) {
                // Ignore
            }
            throw new ResourceNotFoundException(errorMessage);
        } catch (HttpClientErrorException e) {
            log.error("Failed to create comment in Core: {}", e.getResponseBodyAsString());
            String errorMessage = "Failed to create comment";
            try {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
                if (root.has("error")) {
                    errorMessage = root.get("error").asText();
                }
            } catch (Exception parseEx) {
                // Ignore parsing error, fallback to raw response
            }
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                throw new IllegalArgumentException(errorMessage);
            } else if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
                throw new AccessDeniedException(errorMessage);
            }
            throw new RuntimeException(errorMessage);
        }
    }

    public PaginatedResponse<CommentResponse> getComments(Integer announcementId, int page, int size) {
        String url = coreServiceUrl + "/internal/announcements/" + announcementId + "/comments?page=" + page + "&size=" + size;
        
        try {
            ResponseEntity<PaginatedResponse<CommentResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<PaginatedResponse<CommentResponse>>() {}
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            String errorMessage = "Announcement not found (Core 404)";
            try {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
                if (root.has("error")) {
                    errorMessage = root.get("error").asText();
                }
            } catch (Exception parseEx) {
                // Ignore
            }
            throw new ResourceNotFoundException(errorMessage);
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch comments from Core: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Failed to fetch comments");
        }
    }

    public CommentResponse updateComment(Integer commentId, Long userId, UpdateCommentRequest request) {
        String url = coreServiceUrl + "/internal/comments/" + commentId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-User-Id", String.valueOf(userId));

        HttpEntity<UpdateCommentRequest> requestEntity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<CommentResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    requestEntity,
                    CommentResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            String errorMessage = "Comment not found (Core 404)";
            try {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
                if (root.has("error")) {
                    errorMessage = root.get("error").asText();
                }
            } catch (Exception parseEx) {
                // Ignore
            }
            throw new ResourceNotFoundException(errorMessage);
        } catch (HttpClientErrorException e) {
            log.error("Failed to update comment {} in Core: {}", commentId, e.getResponseBodyAsString());
            String errorMessage = "Failed to update comment";
            try {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
                if (root.has("error")) {
                    errorMessage = root.get("error").asText();
                }
            } catch (Exception parseEx) {
                // Ignore parsing error, fallback to raw response
            }
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                throw new IllegalArgumentException(errorMessage);
            } else if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
                throw new AccessDeniedException(errorMessage);
            }
            throw new RuntimeException(errorMessage);
        }
    }

    public void deleteComment(Integer commentId, Long userId) {
        String url = coreServiceUrl + "/internal/comments/" + commentId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", String.valueOf(userId));

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    requestEntity,
                    Void.class
            );
        } catch (HttpClientErrorException.NotFound e) {
            String errorMessage = "Comment not found (Core 404)";
            try {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
                if (root.has("error")) {
                    errorMessage = root.get("error").asText();
                }
            } catch (Exception parseEx) {
                // Ignore
            }
            throw new ResourceNotFoundException(errorMessage);
        } catch (HttpClientErrorException e) {
            log.error("Failed to delete comment {} in Core: {}", commentId, e.getResponseBodyAsString());
            String errorMessage = "Failed to delete comment";
            try {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
                if (root.has("error")) {
                    errorMessage = root.get("error").asText();
                }
            } catch (Exception parseEx) {
                // Ignore parsing error, fallback to raw response
            }
            if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
                throw new AccessDeniedException(errorMessage);
            }
            throw new RuntimeException(errorMessage);
        }
    }
}