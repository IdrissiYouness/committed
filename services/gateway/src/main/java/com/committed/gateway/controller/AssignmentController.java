package com.committed.gateway.controller;

import com.committed.gateway.client.AssignmentServiceClient;
import com.committed.gateway.client.CourseServiceClient;
import com.committed.gateway.dto.ApiResponse;
import com.committed.gateway.dto.CourseResponse;
import com.committed.gateway.dto.PagedResponse;
import com.committed.gateway.dto.UserSummary;
import com.committed.gateway.dto.assignment.AssignmentAttachmentDto;
import com.committed.gateway.dto.assignment.AssignmentRequest;
import com.committed.gateway.dto.assignment.AssignmentResponse;
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

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class AssignmentController {

    private final AssignmentServiceClient assignmentServiceClient;
    private final CourseServiceClient courseServiceClient;
    private final NotificationService notificationService;
    private final RestTemplate restTemplate;

    @Value("${core.service.url}")
    private String coreServiceUrl;

    @PostMapping(value = "/courses/{courseId}/assignments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(
            @PathVariable Long courseId,
            @RequestParam(value = "title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "maxPoints", required = false) BigDecimal maxPoints,
            @RequestParam(value = "dueDate", required = false) OffsetDateTime dueDate,
            @RequestParam(value = "allowLateSubmission", defaultValue = "false") Boolean allowLateSubmission,
            @RequestParam(value = "requireGithubRepo", defaultValue = "false") Boolean requireGithubRepo,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {

        log.debug("REST request to create assignment for courseId: {}", courseId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        // Verify the user is the teacher of this course or admin
        verifyTeacherOrAdmin(courseId.intValue(), userDetails);

        AssignmentResponse response = assignmentServiceClient.createAssignment(
                courseId, userId, title, description, maxPoints, 
                dueDate, allowLateSubmission, requireGithubRepo, files
        );

        // Notify users
        notificationService.notifyNewAnnouncement(courseId, "New Assignment: " + title);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Assignment created successfully"));
    }

    @GetMapping("/courses/{courseId}/assignments")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<AssignmentResponse>>> getCourseAssignments(
            @PathVariable Long courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        log.debug("REST request to get assignments for courseId: {}", courseId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();

        // Verify the user is enrolled, teaches the course, or is admin
        verifyEnrolledOrTeacherOrAdmin(courseId.intValue(), userDetails);

        PagedResponse<AssignmentResponse> assignments = assignmentServiceClient.listAssignments(courseId, page, size);
        return ResponseEntity.ok(ApiResponse.success(assignments, "Assignments retrieved successfully"));
    }

    @GetMapping("/assignments/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> getAssignment(
            @PathVariable Long id,
            Authentication authentication) {
        
        log.debug("REST request to get assignment : {}", id);
        
        // Fetch assignment first to get the courseId
        AssignmentResponse assignment = assignmentServiceClient.getAssignment(id);
        
        // Verify user has access to the course
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        verifyEnrolledOrTeacherOrAdmin(assignment.getCourseId().intValue(), userDetails);
        
        return ResponseEntity.ok(ApiResponse.success(assignment, "Assignment retrieved successfully"));
    }

    @PutMapping(value = "/assignments/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> updateAssignment(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "maxPoints", required = false) BigDecimal maxPoints,
            @RequestParam(value = "dueDate", required = false) OffsetDateTime dueDate,
            @RequestParam(value = "allowLateSubmission", required = false) Boolean allowLateSubmission,
            @RequestParam(value = "requireGithubRepo", required = false) Boolean requireGithubRepo,
            @RequestParam(value = "removeAttachmentIds", required = false) List<Integer> removeAttachmentIds,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {

        log.debug("REST request to update assignment : {}", id);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        // The Core service ensures the X-User-Id matches the createdBy field
        AssignmentResponse updated = assignmentServiceClient.updateAssignment(
                id, userId, title, description, maxPoints, dueDate,
                allowLateSubmission, requireGithubRepo, removeAttachmentIds, files
        );
        return ResponseEntity.ok(ApiResponse.success(updated, "Assignment updated successfully"));
    }

    @DeleteMapping("/assignments/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(
            @PathVariable Long id,
            Authentication authentication) {
        
        log.debug("REST request to delete assignment : {}", id);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        assignmentServiceClient.deleteAssignment(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Assignment deleted successfully"));
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
            throw new org.springframework.security.access.AccessDeniedException("You must be enrolled in this course to perform this action");
        }
    }
}