package com.committed.gateway.client;

import com.committed.gateway.dto.CourseResponse;
import com.committed.gateway.dto.CreateCourseRequest;
import com.committed.gateway.dto.UpdateCourseRequest;
import com.committed.gateway.dto.UserSummary;
import com.committed.gateway.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseServiceClient {

    private final RestTemplate restTemplate;

    @Value("${core.service.url}")
    private String coreServiceUrl;

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    public List<CourseResponse> getAllCourses(Long userId) {
        String url = coreServiceUrl + "/internal/courses";
        if (userId != null) {
            url += "?userId=" + userId;
        }
        try {
            ResponseEntity<List<CourseResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(jsonHeaders()),
                    new ParameterizedTypeReference<List<CourseResponse>>() {}
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch courses from Core: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Failed to fetch courses");
        }
    }

    public CourseResponse getCourse(Integer id) {
        String url = coreServiceUrl + "/internal/courses/" + id;
        try {
            ResponseEntity<CourseResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(jsonHeaders()),
                    CourseResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Course not found");
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch course {} from Core: {}", id, e.getResponseBodyAsString());
            throw new RuntimeException("Failed to fetch course");
        }
    }

    public CourseResponse createCourse(CreateCourseRequest request, Long teacherId) {
        String url = coreServiceUrl + "/internal/courses";

        // Map the gateway DTO + context teacherId to the Core expected structure
        Map<String, Object> coreRequest = new HashMap<>();
        coreRequest.put("courseCode", request.getCourseCode());
        coreRequest.put("courseName", request.getCourseName());
        coreRequest.put("description", request.getDescription());
        coreRequest.put("section", request.getSection());
        coreRequest.put("subject", request.getSubject());
        coreRequest.put("teacherId", teacherId);

        try {
            ResponseEntity<CourseResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(coreRequest, jsonHeaders()),
                    CourseResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.Conflict e) {
            throw new RuntimeException("Course code already exists");
        } catch (HttpClientErrorException e) {
            log.error("Failed to create course in Core: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Failed to create course");
        }
    }

    public CourseResponse updateCourse(Integer id, UpdateCourseRequest request) {
        String url = coreServiceUrl + "/internal/courses/" + id;
        try {
            ResponseEntity<CourseResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    new HttpEntity<>(request, jsonHeaders()),
                    CourseResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Course not found");
        } catch (HttpClientErrorException e) {
            log.error("Failed to update course {} in Core: {}", id, e.getResponseBodyAsString());
            throw new RuntimeException("Failed to update course");
        }
    }

    public void deleteCourse(Integer id) {
        String url = coreServiceUrl + "/internal/courses/" + id;
        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    new HttpEntity<>(jsonHeaders()),
                    Void.class
            );
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Course not found");
        } catch (HttpClientErrorException e) {
            log.error("Failed to delete course {} in Core: {}", id, e.getResponseBodyAsString());
            throw new RuntimeException("Failed to delete course");
        }
    }

    public void enrollInCourse(String courseCode, Long userId) {
        String url = coreServiceUrl + "/internal/courses/enroll";
        Map<String, Object> coreRequest = new HashMap<>();
        coreRequest.put("courseCode", courseCode);
        coreRequest.put("userId", userId);

        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(coreRequest, jsonHeaders()),
                    Void.class
            );
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Course or user not found");
        } catch (HttpClientErrorException.BadRequest e) {
            throw new IllegalArgumentException("Cannot enroll in course (may be closed or you are the teacher)");
        } catch (HttpClientErrorException.Conflict e) {
            throw new IllegalArgumentException("User is already enrolled in this course");
        } catch (HttpClientErrorException e) {
            log.error("Failed to enroll in course: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Failed to enroll in course");
        }
    }

    public void unenrollFromCourse(Integer courseId, Long userId) {
        String url = coreServiceUrl + "/internal/courses/" + courseId + "/enroll/" + userId;
        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    new HttpEntity<>(jsonHeaders()),
                    Void.class
            );
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Enrollment not found");
        } catch (HttpClientErrorException.BadRequest e) {
            throw new IllegalArgumentException("Cannot unenroll from course (professors cannot unenroll)");
        } catch (HttpClientErrorException e) {
            log.error("Failed to unenroll from course {}: {}", courseId, e.getResponseBodyAsString());
            throw new RuntimeException("Failed to unenroll from course");
        }
    }

    public List<UserSummary> getCourseStudents(Integer courseId) {
        String url = coreServiceUrl + "/internal/courses/" + courseId + "/students";
        try {
            ResponseEntity<List<UserSummary>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(jsonHeaders()),
                    new ParameterizedTypeReference<List<UserSummary>>() {}
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Course not found");
        } catch (HttpClientErrorException e) {
            log.error("Failed to fetch students for course {}: {}", courseId, e.getResponseBodyAsString());
            throw new RuntimeException("Failed to fetch course students");
        }
    }
}