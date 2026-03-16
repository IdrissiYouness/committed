package com.committed.gateway.controller;

import com.committed.gateway.client.CourseServiceClient;
import com.committed.gateway.dto.ApiResponse;
import com.committed.gateway.dto.CourseResponse;
import com.committed.gateway.dto.CreateCourseRequest;
import com.committed.gateway.dto.UpdateCourseRequest;
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
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseServiceClient courseServiceClient;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAllCourses(Authentication authentication) {
        log.info("Fetching courses based on user role");
        
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userDetails.systemRole()) || "ROLE_ADMIN".equalsIgnoreCase(userDetails.systemRole());
        
        Long userId = isAdmin ? null : Long.parseLong(userDetails.userId());
        
        List<CourseResponse> courses = courseServiceClient.getAllCourses(userId);
        return ResponseEntity.ok(ApiResponse.success(courses, "Courses retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourse(@PathVariable Integer id) {
        log.info("Fetching course with id: {}", id);
        CourseResponse course = courseServiceClient.getCourse(id);
        return ResponseEntity.ok(ApiResponse.success(course, "Course retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CreateCourseRequest request,
            Authentication authentication
    ) {
        log.info("Creating new course with code: {}", request.getCourseCode());
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        Long teacherId = Long.parseLong(userDetails.userId());
        
        CourseResponse course = courseServiceClient.createCourse(request, teacherId);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(course, "Course created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateCourseRequest request,
            Authentication authentication
    ) {
        log.info("Updating course with id: {}", id);
        
        // Fetch the course first to verify ownership
        CourseResponse existingCourse = courseServiceClient.getCourse(id);
        
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        
        // Authorization check: Only the teacher of the course or an admin can update it
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userDetails.systemRole()) || "ROLE_ADMIN".equalsIgnoreCase(userDetails.systemRole());
                
        boolean isTeacher = existingCourse.getTeacher() != null && 
                            existingCourse.getTeacher().getUserId().equals(Long.parseLong(userDetails.userId()));
                            
        if (!isAdmin && !isTeacher) {
            log.warn("User {} attempted to update course {} without permission", userDetails.userId(), id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<CourseResponse>builder().success(false).message("You do not have permission to update this course").build());
        }
        
        CourseResponse updatedCourse = courseServiceClient.updateCourse(id, request);
        return ResponseEntity.ok(ApiResponse.success(updatedCourse, "Course updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        log.info("Deleting course with id: {}", id);
        
        // Fetch the course first to verify ownership
        CourseResponse existingCourse = courseServiceClient.getCourse(id);
        
        JwtPrincipal userDetails = (JwtPrincipal) authentication.getPrincipal();
        
        // Authorization check: Only the teacher of the course or an admin can delete it
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userDetails.systemRole()) || "ROLE_ADMIN".equalsIgnoreCase(userDetails.systemRole());
                
        boolean isTeacher = existingCourse.getTeacher() != null && 
                            existingCourse.getTeacher().getUserId().equals(Long.parseLong(userDetails.userId()));
                            
        if (!isAdmin && !isTeacher) {
            log.warn("User {} attempted to delete course {} without permission", userDetails.userId(), id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<Void>builder().success(false).message("You do not have permission to delete this course").build());
        }
        
        courseServiceClient.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Course deleted successfully"));
    }
}