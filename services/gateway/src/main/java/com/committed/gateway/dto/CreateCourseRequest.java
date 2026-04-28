package com.committed.gateway.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCourseRequest {
    
    @NotBlank(message = "Course code is required")
    @Size(max = 50, message = "Course code cannot exceed 50 characters")
    private String courseCode;
    
    @NotBlank(message = "Course name is required")
    @Size(max = 255, message = "Course name cannot exceed 255 characters")
    private String courseName;
    
    private String description;
    
    @Size(max = 50, message = "Section cannot exceed 50 characters")
    private String section;
    
    @Size(max = 100, message = "Subject cannot exceed 100 characters")
    private String subject;
    
    private Boolean isOpen;

    // We do not include teacherId here because it should be automatically
    // populated from the currently authenticated user's context in the controller.
}