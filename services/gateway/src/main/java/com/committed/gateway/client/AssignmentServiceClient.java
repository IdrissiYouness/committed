package com.committed.gateway.client;

import com.committed.gateway.dto.assignment.AssignmentRequest;
import com.committed.gateway.dto.assignment.AssignmentResponse;
import com.committed.gateway.dto.PagedResponse;
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
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentServiceClient {

    private final RestTemplate restTemplate;

    @Value("${core.service.url}")
    private String coreServiceUrl;

    public AssignmentResponse createAssignment(Long courseId, Long userId, String title, String description, 
                                               BigDecimal maxPoints, OffsetDateTime dueDate, 
                                               Boolean allowLateSubmission, Boolean requireGithubRepo, 
                                               List<MultipartFile> attachments) {
        String url = coreServiceUrl + "/internal/courses/" + courseId + "/assignments";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-User-Id", String.valueOf(userId));

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("title", title);
        
        if (description != null) body.add("description", description);
        if (maxPoints != null) body.add("maxPoints", maxPoints.toString());
        if (dueDate != null) body.add("dueDate", dueDate.toString());
        if (allowLateSubmission != null) body.add("allowLateSubmission", allowLateSubmission.toString());
        if (requireGithubRepo != null) body.add("requireGithubRepo", requireGithubRepo.toString());

        if (attachments != null && !attachments.isEmpty()) {
            for (MultipartFile file : attachments) {
                if (!file.isEmpty()) {
                    try {
                        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                            @Override
                            public String getFilename() {
                                return file.getOriginalFilename();
                            }
                        };
                        HttpHeaders partHeaders = new HttpHeaders();
                        String partFilename = file.getOriginalFilename() != null
                                ? file.getOriginalFilename()
                                : "attachment";
                        String contentType = file.getContentType() != null
                                ? file.getContentType()
                                : MediaType.APPLICATION_OCTET_STREAM_VALUE;
                        partHeaders.setContentDispositionFormData("attachments", partFilename);
                        partHeaders.setContentType(MediaType.parseMediaType(contentType));

                        HttpEntity<ByteArrayResource> filePart = new HttpEntity<>(resource, partHeaders);
                        body.add("attachments", filePart);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to read file attachment", e);
                    }
                }
            }
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<AssignmentResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    AssignmentResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            String errorMessage = extractErrorMessage(e, "Course not found (Core 404)");
            throw new ResourceNotFoundException(errorMessage);
        } catch (HttpClientErrorException e) {
            log.error("Failed to create assignment in Core: {}", e.getResponseBodyAsString());
            String errorMessage = extractErrorMessage(e, "Failed to create assignment");
            handleCommonExceptions(e, errorMessage);
            throw new RuntimeException(errorMessage);
        }
    }

    public PagedResponse<AssignmentResponse> listAssignments(Long courseId, int page, int size) {
        String url = coreServiceUrl + "/internal/courses/" + courseId + "/assignments?page=" + page + "&size=" + size;

        try {
            ResponseEntity<PagedResponse<AssignmentResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<PagedResponse<AssignmentResponse>>() {}
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            String errorMessage = extractErrorMessage(e, "Course not found (Core 404)");
            throw new ResourceNotFoundException(errorMessage);
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch assignments from Core: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Failed to fetch assignments");
        }
    }

    public AssignmentResponse getAssignment(Long id) {
        String url = coreServiceUrl + "/internal/assignments/" + id;

        try {
            ResponseEntity<AssignmentResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    AssignmentResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            String errorMessage = extractErrorMessage(e, "Assignment not found (Core 404)");
            throw new ResourceNotFoundException(errorMessage);
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch assignment {} from Core: {}", id, e.getResponseBodyAsString());
            throw new RuntimeException("Failed to fetch assignment");
        }
    }

    public AssignmentResponse updateAssignment(
            Long id, Long userId, String title, String description,
            BigDecimal maxPoints, OffsetDateTime dueDate,
            Boolean allowLateSubmission, Boolean requireGithubRepo,
            List<Integer> removeAttachmentIds, List<MultipartFile> files) {
        String url = coreServiceUrl + "/internal/assignments/" + id;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-User-Id", String.valueOf(userId));

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        if (title != null) body.add("title", title);
        if (description != null) body.add("description", description);
        if (maxPoints != null) body.add("maxPoints", maxPoints.toString());
        if (dueDate != null) body.add("dueDate", dueDate.toString());
        if (allowLateSubmission != null) body.add("allowLateSubmission", allowLateSubmission.toString());
        if (requireGithubRepo != null) body.add("requireGithubRepo", requireGithubRepo.toString());

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
                        HttpHeaders partHeaders = new HttpHeaders();
                        String partFilename = file.getOriginalFilename() != null
                                ? file.getOriginalFilename()
                                : "attachment";
                        String contentType = file.getContentType() != null
                                ? file.getContentType()
                                : MediaType.APPLICATION_OCTET_STREAM_VALUE;
                        partHeaders.setContentDispositionFormData("attachments", partFilename);
                        partHeaders.setContentType(MediaType.parseMediaType(contentType));

                        HttpEntity<ByteArrayResource> filePart = new HttpEntity<>(resource, partHeaders);
                        body.add("attachments", filePart);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to read file attachment", e);
                    }
                }
            }
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<AssignmentResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    AssignmentResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            String errorMessage = extractErrorMessage(e, "Assignment not found (Core 404)");
            throw new ResourceNotFoundException(errorMessage);
        } catch (HttpClientErrorException e) {
            log.error("Failed to update assignment {} in Core: {}", id, e.getResponseBodyAsString());
            String errorMessage = extractErrorMessage(e, "Failed to update assignment");
            handleCommonExceptions(e, errorMessage);
            throw new RuntimeException(errorMessage);
        }
    }

    public void deleteAssignment(Long id, Long userId) {
        String url = coreServiceUrl + "/internal/assignments/" + id;

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
            String errorMessage = extractErrorMessage(e, "Assignment not found (Core 404)");
            throw new ResourceNotFoundException(errorMessage);
        } catch (HttpClientErrorException e) {
            log.error("Failed to delete assignment {} in Core: {}", id, e.getResponseBodyAsString());
            String errorMessage = extractErrorMessage(e, "Failed to delete assignment");
            if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
                throw new AccessDeniedException(errorMessage);
            }
            throw new RuntimeException(errorMessage);
        }
    }

    private String extractErrorMessage(HttpClientErrorException e, String defaultMessage) {
        String errorMessage = defaultMessage;
        try {
            com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString());
            if (root.has("error")) {
                errorMessage = root.get("error").asText();
            }
        } catch (Exception parseEx) {
            // Ignore
        }
        return errorMessage;
    }

    private void handleCommonExceptions(HttpClientErrorException e, String errorMessage) {
        if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
            throw new IllegalArgumentException(errorMessage);
        } else if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
            throw new AccessDeniedException(errorMessage);
        } else if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
            throw new AccessDeniedException(errorMessage);
        }
    }
}