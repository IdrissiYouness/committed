package com.committed.gateway.client;

import com.committed.gateway.dto.AnnouncementResponse;
import com.committed.gateway.dto.AttachmentResponse;
import com.committed.gateway.dto.PaginatedResponse;
import com.committed.gateway.dto.UpdateAnnouncementRequest;
import com.committed.gateway.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementServiceClient {

    private final RestTemplate restTemplate;

    @Value("${core.service.url}")
    private String coreServiceUrl;

    public AnnouncementResponse createAnnouncement(Integer courseId, Long userId, String title, String content, List<MultipartFile> attachments) {
        String url = coreServiceUrl + "/internal/courses/" + courseId + "/announcements";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("userId", userId);
        body.add("title", title);
        body.add("content", content);

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
            ResponseEntity<AnnouncementResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    AnnouncementResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Course or User not found");
        } catch (HttpClientErrorException e) {
            log.error("Failed to create announcement in Core: {}", e.getResponseBodyAsString());
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                // Try to extract a clean message from the Core JSON error response
                String errorMessage = e.getResponseBodyAsString();
                try {
                    com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(errorMessage);
                    if (root.has("error")) {
                        errorMessage = root.get("error").asText();
                    }
                } catch (Exception parseEx) {
                    // Ignore parsing error, fallback to raw response
                }
                throw new IllegalArgumentException(errorMessage);
            }
            throw new RuntimeException("Failed to create announcement: " + e.getResponseBodyAsString());
        }
    }

    public PaginatedResponse<AnnouncementResponse> getAnnouncements(Integer courseId, int page, int size) {
        String url = coreServiceUrl + "/internal/courses/" + courseId + "/announcements?page=" + page + "&size=" + size;
        try {
            ResponseEntity<PaginatedResponse<AnnouncementResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<PaginatedResponse<AnnouncementResponse>>() {}
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Course not found");
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch announcements from Core: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Failed to fetch announcements");
        }
    }

    public AnnouncementResponse updateAnnouncement(Integer id, String title, String content, List<Integer> removeAttachmentIds, List<MultipartFile> attachments) {
        String url = coreServiceUrl + "/internal/announcements/" + id;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        if (title != null) {
            body.add("title", title);
        }
        if (content != null) {
            body.add("content", content);
        }

        if (removeAttachmentIds != null && !removeAttachmentIds.isEmpty()) {
            for (Integer attachmentId : removeAttachmentIds) {
                body.add("removeAttachmentIds[]", attachmentId);
            }
        }

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
            // Use POST since PHP handles multipart/form-data natively only on POST
            ResponseEntity<AnnouncementResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    AnnouncementResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Announcement not found");
        } catch (HttpClientErrorException e) {
            log.error("Failed to update announcement {} in Core: {}", id, e.getResponseBodyAsString());
            throw new RuntimeException("Failed to update announcement");
        }
    }

    public void deleteAnnouncement(Integer id) {
        String url = coreServiceUrl + "/internal/announcements/" + id;
        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    null,
                    Void.class
            );
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Announcement not found");
        } catch (HttpClientErrorException e) {
            log.error("Failed to delete announcement {} in Core: {}", id, e.getResponseBodyAsString());
            throw new RuntimeException("Failed to delete announcement");
        }
    }

    public AttachmentResponse getAttachment(Integer attachmentId) {
        String url = coreServiceUrl + "/internal/files/" + attachmentId;
        try {
            ResponseEntity<AttachmentResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    AttachmentResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Attachment not found");
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch attachment {} from Core: {}", attachmentId, e.getResponseBodyAsString());
            throw new RuntimeException("Failed to fetch attachment metadata");
        }
    }
}