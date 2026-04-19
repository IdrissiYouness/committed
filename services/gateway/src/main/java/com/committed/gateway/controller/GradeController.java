package com.committed.gateway.controller;

import com.committed.gateway.client.AssignmentServiceClient;
import com.committed.gateway.client.CourseServiceClient;
import com.committed.gateway.client.GradeClient;
import com.committed.gateway.client.SubmissionClient;
import com.committed.gateway.dto.*;
import com.committed.gateway.dto.assignment.AssignmentResponse;
import com.committed.gateway.security.JwtPrincipal;
import com.committed.gateway.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class GradeController {

    private final GradeClient gradeClient;
    private final SubmissionClient submissionClient;
    private final AssignmentServiceClient assignmentServiceClient;
    private final CourseServiceClient courseServiceClient;
    private final NotificationService notificationService;

    @PostMapping("/submissions/{submissionId}/grade")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GradeDto>> createGrade(
            @PathVariable Integer submissionId,
            @Valid @RequestBody GradeRequest request,
            Authentication authentication) {

        log.debug("REST request to grade submission: {}", submissionId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();

        // 3-hop ownership check
        verifyTeacherOwnership(submissionId, userDetails);

        GradeDto grade = gradeClient.createGrade(submissionId, Long.parseLong(userDetails.userId()), userDetails.systemRole(), request);

        notificationService.notifyGradeCreated(submissionId, grade);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(grade, "Grade created successfully"));
    }

    @PutMapping("/grades/{gradeId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GradeDto>> updateGrade(
            @PathVariable Integer gradeId,
            @Valid @RequestBody GradeRequest request,
            Authentication authentication) {

        log.debug("REST request to update grade: {}", gradeId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();

        if (!"ADMIN".equalsIgnoreCase(userDetails.systemRole()) && !"ROLE_ADMIN".equalsIgnoreCase(userDetails.systemRole())) {
            GradeDto existingGrade = gradeClient.getGradeById(gradeId, Long.parseLong(userDetails.userId()), "ADMIN");
            verifyTeacherOwnership(existingGrade.getSubmissionId(), userDetails);
        }

        GradeDto grade = gradeClient.updateGrade(gradeId, Long.parseLong(userDetails.userId()), userDetails.systemRole(), request);

        notificationService.notifyGradeCreated(grade.getSubmissionId(), grade);

        return ResponseEntity.ok(ApiResponse.success(grade, "Grade updated successfully"));
    }

    @GetMapping("/submissions/{submissionId}/grade")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GradeDto>> getGrade(
            @PathVariable Integer submissionId,
            Authentication authentication) {

        log.debug("REST request to get grade for submission: {}", submissionId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        try {
            verifyTeacherOwnership(submissionId, userDetails);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            if ("USER".equalsIgnoreCase(userDetails.systemRole())) {
                // Check student ownership implicitly via submission client
                submissionClient.getSubmission(submissionId, userId, userDetails.systemRole());
            } else {
                throw e;
            }
        }

        GradeDto grade = gradeClient.getGrade(submissionId, userId, userDetails.systemRole());
        return ResponseEntity.ok(ApiResponse.success(grade, "Grade retrieved successfully"));
    }

    @PostMapping("/grades/{gradeId}/validate")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GradeDto>> validateAiGrade(
            @PathVariable Integer gradeId,
            Authentication authentication) {

        log.debug("REST request to validate AI grade: {}", gradeId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();

        if (!"ADMIN".equalsIgnoreCase(userDetails.systemRole()) && !"ROLE_ADMIN".equalsIgnoreCase(userDetails.systemRole())) {
            GradeDto existingGrade = gradeClient.getGradeById(gradeId, Long.parseLong(userDetails.userId()), "ADMIN");
            verifyTeacherOwnership(existingGrade.getSubmissionId(), userDetails);
        }

        GradeDto grade = gradeClient.finalizeGrade(gradeId, Long.parseLong(userDetails.userId()), userDetails.systemRole());

        notificationService.notifyGradeValidated(grade.getSubmissionId(), grade);

        return ResponseEntity.ok(ApiResponse.success(grade, "Grade validated and finalized"));
    }

    @GetMapping("/grades/recent")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<GradeDto>>> getRecentGrades(
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {

        log.debug("REST request to get recent grades");
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        List<GradeDto> grades = gradeClient.getRecentGrades(userId, userDetails.systemRole(), limit);
        return ResponseEntity.ok(ApiResponse.success(grades, "Recent grades retrieved successfully"));
    }

    private void verifyTeacherOwnership(Integer submissionId, JwtPrincipal userDetails) {
        if ("ADMIN".equalsIgnoreCase(userDetails.systemRole()) || "ROLE_ADMIN".equalsIgnoreCase(userDetails.systemRole())) {
            return;
        }

        SubmissionResponse submission = submissionClient.getSubmission(submissionId, Long.parseLong(userDetails.userId()), "ADMIN");
        AssignmentResponse assignment = assignmentServiceClient.getAssignment(submission.getAssignmentId().longValue());
        CourseResponse course = courseServiceClient.getCourse(assignment.getCourseId().intValue());

        boolean isTeacher = course.getTeacher() != null && course.getTeacher().getUserId().equals(Long.parseLong(userDetails.userId()));

        if (!isTeacher) {
            throw new org.springframework.security.access.AccessDeniedException("Only the course teacher or an admin can perform this action");
        }
    }
}