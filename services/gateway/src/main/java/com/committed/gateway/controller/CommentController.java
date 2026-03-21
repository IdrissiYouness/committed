package com.committed.gateway.controller;

import com.committed.gateway.client.CommentServiceClient;
import com.committed.gateway.client.CourseServiceClient;
import com.committed.gateway.dto.*;
import com.committed.gateway.security.JwtPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/courses/{courseId}/announcements/{announcementId}/comments")
public class CommentController {

    private final CommentServiceClient commentServiceClient;
    private final CourseServiceClient courseServiceClient;

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable Integer courseId,
            @PathVariable Integer announcementId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication
    ) {
        log.info("Creating comment for announcement: {}", announcementId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        verifyEnrolledOrTeacherOrAdmin(courseId, userDetails);

        CommentResponse response = commentServiceClient.createComment(announcementId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Comment created successfully"));
    }

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaginatedResponse<CommentResponse>>> getComments(
            @PathVariable Integer courseId,
            @PathVariable Integer announcementId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        log.info("Fetching comments for announcement: {}", announcementId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        
        verifyEnrolledOrTeacherOrAdmin(courseId, userDetails);

        PaginatedResponse<CommentResponse> response = commentServiceClient.getComments(announcementId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Comments retrieved successfully"));
    }

    @PutMapping("/{commentId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Integer courseId,
            @PathVariable Integer announcementId,
            @PathVariable Integer commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            Authentication authentication
    ) {
        log.info("Updating comment: {}", commentId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        verifyEnrolledOrTeacherOrAdmin(courseId, userDetails);
        
        CommentResponse response = commentServiceClient.updateComment(commentId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Comment updated successfully"));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Integer courseId,
            @PathVariable Integer announcementId,
            @PathVariable Integer commentId,
            Authentication authentication
    ) {
        log.info("Deleting comment: {}", commentId);
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.userId());

        verifyEnrolledOrTeacherOrAdmin(courseId, userDetails);
        
        commentServiceClient.deleteComment(commentId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Comment deleted successfully"));
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
            throw new org.springframework.security.access.AccessDeniedException("You must be enrolled in this course to view or post comments");
        }
    }
}