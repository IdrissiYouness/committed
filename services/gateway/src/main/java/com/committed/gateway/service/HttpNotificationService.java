package com.committed.gateway.service;

import com.committed.gateway.client.AssignmentServiceClient;
import com.committed.gateway.client.CourseServiceClient;
import com.committed.gateway.client.CoreServiceClient;
import com.committed.gateway.client.NotificationClient;
import com.committed.gateway.client.SubmissionClient;
import com.committed.gateway.dto.GradeDto;
import com.committed.gateway.dto.NotifyPayload;
import com.committed.gateway.dto.SubmissionResponse;
import com.committed.gateway.dto.UserProfileResponse;
import com.committed.gateway.dto.UserSummary;
import com.committed.gateway.dto.assignment.AssignmentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class HttpNotificationService implements NotificationService {

    private final NotificationClient notificationClient;
    private final SubmissionClient submissionClient;
    private final CourseServiceClient courseServiceClient;
    private final AssignmentServiceClient assignmentServiceClient;
    private final CoreServiceClient coreServiceClient;

    @Async("taskExecutor")
    @Override
    public void notifyAnnouncementCreated(Long courseId, String title, String content, Long professorId) {
        try {
            List<UserSummary> students = courseServiceClient.getCourseStudents(courseId.intValue());
            UserProfileResponse professor = coreServiceClient.getUserProfile(professorId);

            for (UserSummary student : students) {
                notificationClient.notify(NotifyPayload.builder()
                        .type("announcement.created")
                        .recipientEmail(student.getEmail())
                        .recipientName(student.getFullName())
                        .courseName(courseServiceClient.getCourse(courseId.intValue()).getCourseName())
                        .announcementTitle(title)
                        .announcementContent(content)
                        .professorName(professor.getFullName())
                        .build());
            }
        } catch (Exception e) {
            log.error("Failed to send announcement notifications courseId={}: {}", courseId, e.getMessage());
        }
    }

    @Async("taskExecutor")
    @Override
    public void notifyAssignmentCreated(Long courseId, String assignmentTitle, String dueDate, Long professorId) {
        try {
            List<UserSummary> students = courseServiceClient.getCourseStudents(courseId.intValue());
            UserProfileResponse professor = coreServiceClient.getUserProfile(professorId);
            String courseName = courseServiceClient.getCourse(courseId.intValue()).getCourseName();

            for (UserSummary student : students) {
                notificationClient.notify(NotifyPayload.builder()
                        .type("assignment.created")
                        .recipientEmail(student.getEmail())
                        .recipientName(student.getFullName())
                        .courseName(courseName)
                        .assignmentTitle(assignmentTitle)
                        .dueDate(dueDate)
                        .professorName(professor.getFullName())
                        .build());
            }
        } catch (Exception e) {
            log.error("Failed to send assignment notifications courseId={}: {}", courseId, e.getMessage());
        }
    }

    @Async("taskExecutor")
    @Override
    public void notifyGradeCreated(Integer submissionId, GradeDto grade) {
        try {
            StudentContext student = resolveStudent(submissionId);

            notificationClient.notify(NotifyPayload.builder()
                    .type("grade.created")
                    .recipientEmail(student.email())
                    .recipientName(student.name())
                    .courseName(grade.getCourseName())
                    .assignmentTitle(grade.getAssignmentTitle())
                    .pointsEarned(grade.getPointsEarned() != null ? grade.getPointsEarned().doubleValue() : null)
                    .maxPoints(grade.getMaxPoints() != null ? grade.getMaxPoints().doubleValue() : null)
                    .feedback(grade.getFeedback())
                    .gradeSource(grade.getSource())
                    .build());
        } catch (Exception e) {
            log.error("Failed to send grade.created notification submissionId={}: {}", submissionId, e.getMessage());
        }
    }

    @Async("taskExecutor")
    @Override
    public void notifyGradeValidated(Integer submissionId, GradeDto grade) {
        try {
            StudentContext student = resolveStudent(submissionId);

            notificationClient.notify(NotifyPayload.builder()
                    .type("grade.validated")
                    .recipientEmail(student.email())
                    .recipientName(student.name())
                    .courseName(grade.getCourseName())
                    .assignmentTitle(grade.getAssignmentTitle())
                    .pointsEarned(grade.getPointsEarned() != null ? grade.getPointsEarned().doubleValue() : null)
                    .maxPoints(grade.getMaxPoints() != null ? grade.getMaxPoints().doubleValue() : null)
                    .feedback(grade.getFeedback())
                    .build());
        } catch (Exception e) {
            log.error("Failed to send grade.validated notification submissionId={}: {}", submissionId, e.getMessage());
        }
    }

    @Async("taskExecutor")
    @Override
    public void notifyAnalysisCompleted(Integer submissionId, int percentage, String reportUrl) {
        try {
            StudentContext student = resolveStudent(submissionId);
            AssignmentContext assignment = resolveAssignment(submissionId);

            notificationClient.notify(NotifyPayload.builder()
                    .type("analysis.completed")
                    .recipientEmail(student.email())
                    .recipientName(student.name())
                    .courseName(assignment.courseName())
                    .assignmentTitle(assignment.title())
                    .analysisScore(String.valueOf(percentage))
                    .build());
        } catch (Exception e) {
            log.error("Failed to send analysis.completed notification submissionId={}: {}", submissionId, e.getMessage());
        }
    }

    @Async("taskExecutor")
    @Override
    public void notifyAnalysisFailed(Integer submissionId, String failureReason) {
        try {
            StudentContext student = resolveStudent(submissionId);
            AssignmentContext assignment = resolveAssignment(submissionId);

            notificationClient.notify(NotifyPayload.builder()
                    .type("analysis.failed")
                    .recipientEmail(student.email())
                    .recipientName(student.name())
                    .courseName(assignment.courseName())
                    .assignmentTitle(assignment.title())
                    .failureReason(failureReason)
                    .build());
        } catch (Exception e) {
            log.error("Failed to send analysis.failed notification submissionId={}: {}", submissionId, e.getMessage());
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private StudentContext resolveStudent(Integer submissionId) {
        SubmissionResponse submission = submissionClient.getSubmission(submissionId, 1L, "ADMIN");
        UserProfileResponse profile = coreServiceClient.getUserProfile(submission.getStudentId().longValue());
        return new StudentContext(profile.getEmail(), profile.getFullName());
    }

    private AssignmentContext resolveAssignment(Integer submissionId) {
        SubmissionResponse submission = submissionClient.getSubmission(submissionId, 1L, "ADMIN");
        AssignmentResponse assignment = assignmentServiceClient.getAssignment(submission.getAssignmentId().longValue());
        String courseName = courseServiceClient.getCourse(assignment.getCourseId().intValue()).getCourseName();
        return new AssignmentContext(assignment.getTitle(), courseName);
    }

    private record StudentContext(String email, String name) {}
    private record AssignmentContext(String title, String courseName) {}
}
