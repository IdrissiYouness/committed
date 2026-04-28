package com.committed.gateway.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourseRequest {

    @Size(max = 255, message = "Course name cannot exceed 255 characters")
    private String courseName;
    
    private String description;
    
    @Size(max = 50, message = "Section cannot exceed 50 characters")
    private String section;
    
    @Size(max = 100, message = "Subject cannot exceed 100 characters")
    private String subject;
    
    private Boolean isOpen;
    
    // courseCode is generally immutable after creation
    // teacherId is definitely immutable unless transferred 
}