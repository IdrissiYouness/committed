package com.committed.gateway.controller;

import com.committed.gateway.client.AssignmentServiceClient;
import com.committed.gateway.client.CourseServiceClient;
import com.committed.gateway.client.SubmissionClient;
import com.committed.gateway.dto.ApiResponse;
import com.committed.gateway.dto.CourseResponse;
import com.committed.gateway.dto.PagedResponse;
import com.committed.gateway.dto.SubmissionResponse;
import com.committed.gateway.dto.UserSummary;
import com.committed.gateway.dto.assignment.AssignmentResponse;
import com.committed.gateway.security.JwtPrincipal;
import com.committed.gateway.service.MockAIAgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class SubmissionController {

    private final SubmissionClient submissionClient;
    private final AssignmentServiceClient assignmentServiceClient;
    private final CourseServiceClient courseServiceClient;
    private final MockAIAgentService mockAIAgentService;

    @PostMapping(value = "/assignments/{assignmentId}/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> createSubmission(
            @PathVariable Integer assignmentId,
            @RequestParam(value = "submissionText", required = false) String submissionText,
            @RequestParam(value = "githubRepoUrl", required = false) String githubRepoUrl,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {

        log.debug("REST request to create submission for assignmentId: {}", assignmentId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        // Verify the user is enrolled in the course
        AssignmentResponse assignment = assignmentServiceClient.getAssignment(assignmentId.longValue());
        verifyEnrolled(assignment.getCourseId().intValue(), userId);

        try {
            SubmissionResponse response = submissionClient.createSubmission(
                    assignmentId, userId, userDetails.systemRole(), submissionText, githubRepoUrl, files
            );
            
            // Orchestrate AI analysis asynchronously if GitHub URL is provided
            if (githubRepoUrl != null && !githubRepoUrl.trim().isEmpty()) {
                mockAIAgentService.triggerAsyncAnalysis(response.getSubmissionId(), githubRepoUrl);
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Submission created successfully"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.<SubmissionResponse>builder().success(false).message(e.getMessage()).build());
        }
    }

    @PutMapping(value = "/submissions/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> updateSubmission(
            @PathVariable Integer id,
            @RequestParam(value = "submissionText", required = false) String submissionText,
            @RequestParam(value = "githubRepoUrl", required = false) String githubRepoUrl,
            @RequestParam(value = "removeAttachmentIds", required = false) List<Integer> removeAttachmentIds,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {

        log.debug("REST request to update submission: {}", id);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        // Core handles the ownership check for the update
        SubmissionResponse updated = submissionClient.updateSubmission(
                id, userId, userDetails.systemRole(), submissionText, githubRepoUrl, files, removeAttachmentIds
        );
        
        // Orchestrate AI analysis asynchronously if GitHub URL is updated/provided
        if (githubRepoUrl != null && !githubRepoUrl.trim().isEmpty()) {
            mockAIAgentService.triggerAsyncAnalysis(updated.getSubmissionId(), githubRepoUrl);
        }

        return ResponseEntity.ok(ApiResponse.success(updated, "Submission updated successfully"));
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<PagedResponse<SubmissionResponse>>> getSubmissions(
            @PathVariable Integer assignmentId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        log.debug("REST request to get submissions for assignmentId: {}", assignmentId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        AssignmentResponse assignment = assignmentServiceClient.getAssignment(assignmentId.longValue());
        Integer courseId = assignment.getCourseId().intValue();

        boolean canViewAllSubmissions;
        try {
            verifyTeacherOrAdmin(courseId, userDetails);
            canViewAllSubmissions = true;
        } catch (org.springframework.security.access.AccessDeniedException ex) {
            verifyEnrolled(courseId, userId);
            canViewAllSubmissions = false;
        }

        if (canViewAllSubmissions) {
            PagedResponse<SubmissionResponse> submissions = submissionClient.getSubmissions(assignmentId, page, size);
            return ResponseEntity.ok(ApiResponse.success(submissions, "Submissions retrieved successfully"));
        }

        // Student context: return only current student's submissions to avoid false-empty state.
        PagedResponse<SubmissionResponse> allSubmissions = submissionClient.getSubmissions(assignmentId, 1, 1000);
        List<SubmissionResponse> ownSubmissions = allSubmissions.getContent() == null
                ? List.of()
                : allSubmissions.getContent().stream()
                    .filter(submission -> submission.getStudentId() != null
                            && submission.getStudentId().longValue() == userId)
                    .toList();

        PagedResponse<SubmissionResponse> ownPage = PagedResponse.<SubmissionResponse>builder()
                .content(ownSubmissions)
                .page(1)
                .size(Math.max(ownSubmissions.size(), 1))
                .totalElements(ownSubmissions.size())
                .totalPages(ownSubmissions.isEmpty() ? 0 : 1)
                .hasNext(false)
                .hasPrev(false)
                .build();

        return ResponseEntity.ok(ApiResponse.success(ownPage, "Submissions retrieved successfully"));
    }

    @GetMapping("/submissions/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getSubmission(
            @PathVariable Integer id,
            Authentication authentication) {

        log.debug("REST request to get submission: {}", id);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        // We fetch the submission. If it's a USER, Core ensures ownership.
        // If it's a TEACHER/ADMIN, we need to ensure they teach the course.
        SubmissionResponse submission = submissionClient.getSubmission(id, userId, userDetails.systemRole());

        if ("TEACHER".equalsIgnoreCase(userDetails.systemRole())) {
            AssignmentResponse assignment = assignmentServiceClient.getAssignment(submission.getAssignmentId().longValue());
            verifyTeacherOrAdmin(assignment.getCourseId().intValue(), userDetails);
        }

        return ResponseEntity.ok(ApiResponse.success(submission, "Submission retrieved successfully"));
    }

    private void verifyEnrolled(Integer courseId, Long userId) {
        List<UserSummary> students = courseServiceClient.getCourseStudents(courseId);
        boolean isEnrolled = students.stream().anyMatch(s -> s.getUserId().equals(userId));

        if (!isEnrolled) {
            throw new org.springframework.security.access.AccessDeniedException("You must be enrolled in this course to perform this action");
        }
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
}
