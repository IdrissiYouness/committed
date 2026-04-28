<?php

namespace App\Controller;

use App\Entity\Grade;
use App\Repository\GradeRepository;
use App\Repository\SubmissionRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class GradeController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SubmissionRepository $submissionRepository,
        private GradeRepository $gradeRepository,
        private UserRepository $userRepository
    ) {
    }

    #[Route('/internal/submissions/{id}/grade', methods: ['POST'])]
    public function createGrade(int $id, Request $request): JsonResponse
    {
        $submission = $this->submissionRepository->find($id);
        if (!$submission) {
            return $this->json(['error' => 'Submission not found'], Response::HTTP_NOT_FOUND);
        }

        if ($submission->getGrade() !== null) {
            return $this->json(['error' => 'Submission already has a grade'], Response::HTTP_CONFLICT);
        }

        $graderId = $request->headers->get('X-User-Id');
        if (!$graderId) {
            return $this->json(['error' => 'Missing X-User-Id header'], Response::HTTP_BAD_REQUEST);
        }

        $grader = $this->userRepository->find($graderId);
        if (!$grader) {
            return $this->json(['error' => 'Grader not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        if (!isset($data['pointsEarned'])) {
            return $this->json(['error' => 'pointsEarned is required'], Response::HTTP_BAD_REQUEST);
        }

        $pointsEarned = (float) $data['pointsEarned'];
        $maxPoints = (float) $submission->getAssignment()->getMaxPoints();

        if ($pointsEarned > $maxPoints) {
            return $this->json([
                'error' => "Points earned ($pointsEarned) cannot exceed maximum points ($maxPoints)"
            ], Response::HTTP_BAD_REQUEST);
        }

        $grade = new Grade();
        $grade->setSubmission($submission);
        $grade->setGradedBy($grader);
        $grade->setPointsEarned((string)$data['pointsEarned']);
        $grade->setMaxPoints((string)$submission->getAssignment()->getMaxPoints());
        $grade->setFeedback($data['feedback'] ?? null);
        $grade->setSource('manual');
        $grade->setIsFinalized(true);

        $submission->setStatus('graded');

        $this->entityManager->persist($grade);
        $this->entityManager->flush();

        return $this->json($this->formatGrade($grade), Response::HTTP_CREATED);
    }

    #[Route('/internal/grades/{gradeId}', methods: ['PUT'], requirements: ['gradeId' => '\d+'])]
    public function updateGrade(int $gradeId, Request $request): JsonResponse
    {
        $grade = $this->gradeRepository->find($gradeId);
        if (!$grade) {
            return $this->json(['error' => 'Grade not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        if (isset($data['pointsEarned'])) {
            $pointsEarned = (float) $data['pointsEarned'];
            $maxPoints = (float) $grade->getMaxPoints();

            if ($pointsEarned > $maxPoints) {
                return $this->json([
                    'error' => "Points earned ($pointsEarned) cannot exceed maximum points ($maxPoints)"
                ], Response::HTTP_BAD_REQUEST);
            }
            $grade->setPointsEarned((string)$data['pointsEarned']);
        }

        if (array_key_exists('feedback', $data)) {
            $grade->setFeedback($data['feedback']);
        }

        $grade->setSource('manual');
        $grade->setIsFinalized(true);
        $grade->getSubmission()->setStatus('graded');

        $this->entityManager->flush();

        return $this->json($this->formatGrade($grade));
    }

    #[Route('/internal/grades/{gradeId}/finalize', methods: ['POST'], requirements: ['gradeId' => '\d+'])]
    public function finalizeGrade(int $gradeId): JsonResponse
    {
        $grade = $this->gradeRepository->find($gradeId);
        if (!$grade) {
            return $this->json(['error' => 'Grade not found'], Response::HTTP_NOT_FOUND);
        }

        $grade->setIsFinalized(true);
        $grade->getSubmission()->setStatus('graded');

        $this->entityManager->flush();

        return $this->json($this->formatGrade($grade));
    }

    #[Route('/internal/grades/{gradeId}', methods: ['GET'], requirements: ['gradeId' => '\d+'])]
    public function getGradeById(int $gradeId): JsonResponse
    {
        $grade = $this->gradeRepository->find($gradeId);
        if (!$grade) {
            return $this->json(['error' => 'Grade not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->formatGrade($grade));
    }

    #[Route('/internal/submissions/{id}/grade', methods: ['GET'])]
    public function getGrade(int $id): JsonResponse
    {
        $submission = $this->submissionRepository->find($id);
        if (!$submission) {
            return $this->json(['error' => 'Submission not found'], Response::HTTP_NOT_FOUND);
        }

        $grade = $submission->getGrade();
        if (!$grade) {
            return $this->json(['error' => 'Grade not found for this submission'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->formatGrade($grade));
    }

    #[Route('/internal/grades/recent', methods: ['GET'])]
    public function getRecentGrades(Request $request): JsonResponse
    {
        $userId = $request->headers->get('X-User-Id');
        if (!$userId) {
            return $this->json(['error' => 'Missing X-User-Id header'], Response::HTTP_BAD_REQUEST);
        }

        $limit = max(1, min(50, (int) $request->query->get('limit', 20)));
        $grades = $this->gradeRepository->findRecentByStudentId((int) $userId, $limit);

        $data = array_map(function (Grade $grade) {
            $formatted = $this->formatGrade($grade);
            $submission = $grade->getSubmission();
            $assignment = $submission->getAssignment();
            $course = $assignment->getCourse();

            $formatted['assignmentId'] = $assignment->getAssignmentId();
            $formatted['assignmentTitle'] = $assignment->getTitle();
            $formatted['courseId'] = $course->getCourseId();
            $formatted['courseName'] = $course->getCourseName();
            $formatted['courseCode'] = $course->getCourseCode();

            return $formatted;
        }, $grades);

        return $this->json($data, Response::HTTP_OK);
    }

    private function formatGrade(Grade $grade): array
    {
        return [
            'gradeId' => $grade->getGradeId(),
            'submissionId' => $grade->getSubmission()->getSubmissionId(),
            'gradedBy' => [
                'userId' => $grade->getGradedBy()->getUserId(),
                'fullName' => $grade->getGradedBy()->getFullName(),
                'email' => $grade->getGradedBy()->getEmail()
            ],
            'pointsEarned' => $grade->getPointsEarned(),
            'maxPoints' => $grade->getMaxPoints(),
            'feedback' => $grade->getFeedback(),
            'gradedAt' => $grade->getGradedAt()->format('Y-m-d\TH:i:s\Z'),
            'source' => $grade->getSource(),
            'isFinalized' => $grade->isFinalized(),
        ];
    }
}