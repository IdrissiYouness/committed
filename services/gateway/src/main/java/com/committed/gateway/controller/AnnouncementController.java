package com.committed.gateway.controller;

import com.committed.gateway.client.AnnouncementServiceClient;
import com.committed.gateway.client.CourseServiceClient;
import com.committed.gateway.dto.*;
import com.committed.gateway.security.JwtPrincipal;
import com.committed.gateway.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementServiceClient announcementServiceClient;
    private final CourseServiceClient courseServiceClient;
    private final NotificationService notificationService;
    private final RestTemplate restTemplate;

    @Value("${core.service.url}")
    private String coreServiceUrl;

    @PostMapping(value = "/api/courses/{courseId}/announcements", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @PathVariable Integer courseId,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments,
            Authentication authentication
    ) {
        log.info("Creating announcement for course: {}", courseId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        verifyTeacherOrAdmin(courseId, userDetails);

        AnnouncementResponse response = announcementServiceClient.createAnnouncement(courseId, userId, title, content, attachments);

        // Asynchronously notify users
        notificationService.notifyNewAnnouncement(Long.valueOf(courseId), title);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Announcement created successfully"));
    }

    @GetMapping("/api/courses/{courseId}/announcements")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaginatedResponse<AnnouncementResponse>>> getAnnouncements(
            @PathVariable Integer courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        log.info("Fetching announcements for course: {}", courseId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        
        verifyEnrolledOrTeacherOrAdmin(courseId, userDetails);

        PaginatedResponse<AnnouncementResponse> response = announcementServiceClient.getAnnouncements(courseId, page, size);

        return ResponseEntity.ok(ApiResponse.success(response, "Announcements retrieved successfully"));
    }

    @PutMapping(value = "/api/courses/{courseId}/announcements/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> updateAnnouncement(
            @PathVariable Integer courseId,
            @PathVariable Integer id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "removeAttachmentIds", required = false) List<Integer> removeAttachmentIds,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments,
            Authentication authentication
    ) {
        log.info("Updating announcement: {} for course: {}", id, courseId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        verifyTeacherOrAdmin(courseId, userDetails);

        AnnouncementResponse response = announcementServiceClient.updateAnnouncement(id, title, content, removeAttachmentIds, attachments);
        return ResponseEntity.ok(ApiResponse.success(response, "Announcement updated successfully"));
    }

    @DeleteMapping("/api/courses/{courseId}/announcements/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(
            @PathVariable Integer courseId,
            @PathVariable Integer id,
            Authentication authentication
    ) {
        log.info("Deleting announcement: {} for course: {}", id, courseId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        verifyTeacherOrAdmin(courseId, userDetails);
        
        announcementServiceClient.deleteAnnouncement(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Announcement deleted successfully"));
    }

    @GetMapping("/api/courses/{courseId}/announcements/{announcementId}/attachments/{attachmentId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Integer courseId,
            @PathVariable Integer announcementId,
            @PathVariable Integer attachmentId,
            Authentication authentication
    ) {
        log.info("Downloading attachment: {}", attachmentId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        
        verifyEnrolledOrTeacherOrAdmin(courseId, userDetails);

        AttachmentResponse metadata = announcementServiceClient.getAttachment(attachmentId);

        // Stream the file directly from the Core service's public uploads directory
        String fileUrl = coreServiceUrl + "/uploads/" + metadata.getFilePath();
        
        ResponseEntity<Resource> fileResponse = restTemplate.getForEntity(fileUrl, Resource.class);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(metadata.getFileType() != null ? metadata.getFileType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + metadata.getFileName() + "\"")
                .body(fileResponse.getBody());
    }

    private void verifyTeacherOrAdmin(Integer courseId, JwtPrincipal userDetails) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userDetails.systemRole()) || "ROLE_ADMIN".equalsIgnoreCase(userDetails.systemRole());
        if (isAdmin) return;

        CourseResponse course = courseServiceClient.getCourse(courseId);
        boolean isTeacher = course.getTeacher() != null && course.getTeacher().getUserId().equals(Long.parseLong(userDetails.userId()));

        if (!isTeacher) {
            throw new org.springframework.security.access.AccessDeniedException("Only the course teacher or an admin can perform this action");
        }
    }

    private void verifyEnrolledOrTeacherOrAdmin(Integer courseId, JwtPrincipal userDetails) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userDetails.systemRole()) || "ROLE_ADMIN".equalsIgnoreCase(userDetails.systemRole());
        if (isAdmin) return;

        CourseResponse course = courseServiceClient.getCourse(courseId);
        Long userId = Long.parseLong(userDetails.userId());
        boolean isTeacher = course.getTeacher() != null && course.getTeacher().getUserId().equals(userId);

        if (isTeacher) return;

        List<UserSummary> students = courseServiceClient.getCourseStudents(courseId);
        boolean isEnrolled = students.stream().anyMatch(s -> s.getUserId().equals(userId));

        if (!isEnrolled) {
            throw new org.springframework.security.access.AccessDeniedException("You must be enrolled in this course to view its announcements");
        }
    }
}