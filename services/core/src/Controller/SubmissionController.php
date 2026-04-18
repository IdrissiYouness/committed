<?php

namespace App\Controller;

use App\Entity\Submission;
use App\Entity\SubmissionAttachment;
use App\Entity\CodeAnalysis;
use App\Repository\AssignmentRepository;
use App\Repository\SubmissionRepository;
use App\Repository\UserRepository;
use App\Service\FileStorageService;
use App\Service\SubmissionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class SubmissionController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private SubmissionRepository $submissionRepository;
    private AssignmentRepository $assignmentRepository;
    private UserRepository $userRepository;
    private FileStorageService $fileStorage;
    private SubmissionService $submissionService;

    public function __construct(
        EntityManagerInterface $entityManager,
        SubmissionRepository $submissionRepository,
        AssignmentRepository $assignmentRepository,
        UserRepository $userRepository,
        FileStorageService $fileStorage,
        SubmissionService $submissionService
    ) {
        $this->entityManager = $entityManager;
        $this->submissionRepository = $submissionRepository;
        $this->assignmentRepository = $assignmentRepository;
        $this->userRepository = $userRepository;
        $this->fileStorage = $fileStorage;
        $this->submissionService = $submissionService;
    }

    #[Route('/internal/assignments/{assignmentId}/submissions', name: 'internal_create_submission', methods: ['POST'])]
    public function createSubmission(int $assignmentId, Request $request): JsonResponse
    {
        $userId = $request->headers->get('X-User-Id');
        if (!$userId) return $this->json(['error' => 'User ID is required'], 401);

        $assignment = $this->assignmentRepository->find($assignmentId);
        if (!$assignment) return $this->json(['error' => 'Assignment not found'], 404);

        $student = $this->userRepository->find((int)$userId);
        if (!$student) return $this->json(['error' => 'Student not found'], 404);

        $existing = $this->submissionRepository->findOneByStudentAndAssignment($student->getUserId(), $assignmentId);
        if ($existing) {
            return $this->json(['error' => 'Submission already exists. Use PUT to update.'], 409);
        }

        $submittedAt = new \DateTimeImmutable();
        if (!$this->submissionService->canAcceptSubmission($assignment, $submittedAt)) {
            return $this->json(['error' => 'Late submissions are not allowed for this assignment.'], 403);
        }

        $submission = new Submission();
        $submission->setAssignment($assignment);
        $submission->setStudent($student);
        $submission->setStatus($this->submissionService->determineStatus($assignment, $submittedAt));

        $submissionText = $request->request->get('submissionText');
        if ($submissionText) $submission->setSubmissionText($submissionText);

        $githubUrl = $request->request->get('githubRepoUrl');

        if ($assignment->isRequireGithubRepo() && empty($githubUrl)) {
            return $this->json(['error' => 'This assignment requires a GitHub repository URL.'], 400);
        }

        if ($githubUrl) {
            if (!preg_match('/^https?:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-._]+.*$/', $githubUrl)) {
                return $this->json(['error' => 'Invalid GitHub URL format'], 400);
            }
            $submission->setGithubRepoUrl($githubUrl === '' ? null : $githubUrl);
        }

        $filesParam = $request->files->get('files');
        $files = is_array($filesParam) ? $filesParam : ($filesParam ? [$filesParam] : []);
        
        foreach ($files as $file) {
            if (!$file) continue;
            try {
                $meta = $this->fileStorage->uploadFile($file, 'submissions');
                $attachment = new SubmissionAttachment();
                $attachment->setFileName($meta['fileName']);
                $attachment->setFilePath($meta['filePath']);
                $attachment->setFileType($meta['fileType']);
                $attachment->setFileSize($meta['fileSize']);
                $attachment->setUploadedBy($student);
                $submission->addAttachment($attachment);
            } catch (\Exception $e) {
                return $this->json(['error' => $e->getMessage()], 400);
            }
        }

        $this->entityManager->persist($submission);
        $this->entityManager->flush();

        return $this->json($this->formatSubmission($submission), 201);
    }

    #[Route('/internal/assignments/{assignmentId}/submissions', name: 'internal_list_submissions', methods: ['GET'])]
    public function listSubmissions(int $assignmentId, Request $request): JsonResponse
    {
        $page = max(1, $request->query->getInt('page', 1));
        $limit = max(1, min(50, $request->query->getInt('size', 20)));

        $assignment = $this->assignmentRepository->find($assignmentId);
        if (!$assignment) return $this->json(['error' => 'Assignment not found'], 404);

        $paginator = $this->submissionRepository->findByAssignmentWithPagination($assignmentId, $page, $limit);
        $total = count($paginator);

        $items = [];
        $statusChanged = false;
        foreach ($paginator as $sub) {
            if ($this->syncSubmissionStatusFromGrade($sub)) {
                $statusChanged = true;
            }
            $items[] = $this->formatSubmission($sub);
        }

        if ($statusChanged) {
            $this->entityManager->flush();
        }

        return $this->json([
            'content' => $items,
            'page' => $page,
            'size' => $limit,
            'totalElements' => $total,
            'totalPages' => ceil($total / $limit)
        ]);
    }

    #[Route('/internal/submissions/{id}', name: 'internal_get_submission', methods: ['GET'])]
    public function getSubmission(int $id, Request $request): JsonResponse
    {
        $submission = $this->submissionRepository->find($id);
        if (!$submission) return $this->json(['error' => 'Submission not found'], 404);

        $userId = $request->headers->get('X-User-Id');
        $userRole = $request->headers->get('X-User-Role');

        if (in_array($userRole, ['USER', 'ROLE_USER']) && $submission->getStudent()->getUserId() !== (int)$userId) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        if ($this->syncSubmissionStatusFromGrade($submission)) {
            $this->entityManager->flush();
        }

        return $this->json($this->formatSubmission($submission));
    }

    #[Route('/internal/submissions/{id}', name: 'internal_update_submission', methods: ['POST'])]
    public function updateSubmission(int $id, Request $request): JsonResponse
    {
        $userId = $request->headers->get('X-User-Id');
        if (!$userId) return $this->json(['error' => 'User ID is required'], 401);

        $submission = $this->submissionRepository->find($id);
        if (!$submission) return $this->json(['error' => 'Submission not found'], 404);

        if ($submission->getStudent()->getUserId() !== (int)$userId) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        if ($submission->getGrade() || in_array($submission->getStatus(), ['graded', 'returned'])) {
            return $this->json(['error' => 'Cannot update a submission that has already been graded or returned'], 403);
        }

        $assignment = $submission->getAssignment();
        $submittedAt = new \DateTimeImmutable();
        if (!$this->submissionService->canAcceptSubmission($assignment, $submittedAt)) {
            return $this->json(['error' => 'Late submissions are not allowed for this assignment.'], 403);
        }

        // Handle JSON or multipart
        $contentType = $request->headers->get('Content-Type', '');
        if (str_starts_with($contentType, 'application/json')) {
            $data = json_decode($request->getContent(), true) ?? [];
            $removeAttachmentIds = $data['removeAttachmentIds'] ?? [];
        } else {
            $data = $request->request->all();
            $removeParam = $request->request->get('removeAttachmentIds');
            $removeAttachmentIds = is_array($removeParam) ? $removeParam : ($removeParam ? [$removeParam] : []);
        }

        if (array_key_exists('submissionText', $data)) {
            $submission->setSubmissionText($data['submissionText']);
        }

        if (array_key_exists('githubRepoUrl', $data)) {
            $githubUrl = $data['githubRepoUrl'];

            if ($assignment->isRequireGithubRepo() && empty($githubUrl)) {
                return $this->json(['error' => 'This assignment requires a GitHub repository URL.'], 400);
            }

            if ($githubUrl && !preg_match('/^https?:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-._]+.*$/', $githubUrl)) {
                return $this->json(['error' => 'Invalid GitHub URL format'], 400);
            }
            if ($submission->getGithubRepoUrl() !== $githubUrl) {
                $submission->setGithubRepoUrl($githubUrl === '' ? null : $githubUrl);
                // If URL is removed completely, remove the analysis record natively in Core
                // Since there is no longer a URL to analyze
                if (!$githubUrl && $submission->getCodeAnalysis()) {
                    $this->entityManager->remove($submission->getCodeAnalysis());
                    $submission->setCodeAnalysis(null);
                }
            }
        }

        // Process removed attachments
        foreach ($removeAttachmentIds as $attId) {
            foreach ($submission->getAttachments() as $attachment) {
                if ($attachment->getAttachmentId() === (int)$attId) {
                    try {
                        $this->fileStorage->deleteFile($attachment->getFilePath());
                        $submission->removeAttachment($attachment);
                    } catch (\Exception $e) {
                        return $this->json(['error' => 'Could not delete file: ' . $e->getMessage()], 500);
                    }
                }
            }
        }

        // Process new attachments
        $filesParam = $request->files->get('files');
        $files = is_array($filesParam) ? $filesParam : ($filesParam ? [$filesParam] : []);
        
        $student = $this->userRepository->find((int)$userId);
        foreach ($files as $file) {
            if (!$file) continue;
            try {
                $meta = $this->fileStorage->uploadFile($file, 'submissions');
                $attachment = new SubmissionAttachment();
                $attachment->setFileName($meta['fileName']);
                $attachment->setFilePath($meta['filePath']);
                $attachment->setFileType($meta['fileType']);
                $attachment->setFileSize($meta['fileSize']);
                $attachment->setUploadedBy($student);
                $submission->addAttachment($attachment);
            } catch (\Exception $e) {
                return $this->json(['error' => $e->getMessage()], 400);
            }
        }

        $submission->setStatus($this->submissionService->determineStatus($assignment, $submittedAt));

        $this->entityManager->flush();

        return $this->json($this->formatSubmission($submission));
    }

    #[Route('/internal/submissions/{id}/analysis', name: 'internal_save_analysis', methods: ['POST'])]
    public function saveAnalysis(int $id, Request $request): JsonResponse
    {
        $submission = $this->submissionRepository->find($id);
        if (!$submission) return $this->json(['error' => 'Submission not found'], 404);

        $data = json_decode($request->getContent(), true) ?? [];

        $analysis = $submission->getCodeAnalysis();
        if (!$analysis) {
            $analysis = new CodeAnalysis();
            $analysis->setSubmission($submission);
            $submission->setCodeAnalysis($analysis);
        }

        if (isset($data['status'])) {
            $analysis->setStatus($data['status']);
        }
        if (isset($data['metricsData'])) {
            $analysis->setMetricsData($data['metricsData']);
        }
        if (isset($data['reportPdfUrl'])) {
            $analysis->setReportPdfUrl($data['reportPdfUrl']);
        }
        
        if (($data['status'] ?? '') === 'completed') {
            $analysis->setAnalyzedAt(new \DateTime());
            // Diagram: UPDATE SUBMISSION (status=analyzed) 
            // Note: Schema doesn't allow 'analyzed' in submission status check constraint. 
            // So we just rely on code_analysis status as the single source of truth for the analysis state.
        }

        $this->entityManager->persist($analysis);

        $this->entityManager->flush();

        return $this->json($this->formatSubmission($submission));
    }

    private function syncSubmissionStatusFromGrade(Submission $submission): bool
    {
        if ($submission->getGrade() && $submission->getStatus() !== 'graded') {
            $submission->setStatus('graded');
            $submission->setUpdatedAt(new \DateTime());
            return true;
        }

        return false;
    }

    private function formatSubmission(Submission $submission): array
    {
        $attachments = [];
        foreach ($submission->getAttachments() as $att) {
            $attachments[] = [
                'attachmentId' => $att->getAttachmentId(),
                'fileName' => $att->getFileName(),
                'fileType' => $att->getFileType(),
                'fileSize' => $att->getFileSize(),
                'filePath' => $att->getFilePath(),
                'uploadedAt' => $att->getUploadedAt()->format(\DateTime::RFC3339)
            ];
        }

        $analysis = null;
        if ($submission->getCodeAnalysis()) {
            $ca = $submission->getCodeAnalysis();
            $analysis = [
                'status' => $ca->getStatus(),
                'metricsData' => $ca->getMetricsData(),
                'reportPdfUrl' => $ca->getReportPdfUrl()
            ];
        }

        return [
            'submissionId' => $submission->getSubmissionId(),
            'assignmentId' => $submission->getAssignment()->getAssignmentId(),
            'studentId' => $submission->getStudent()->getUserId(),
            'submissionText' => $submission->getSubmissionText(),
            'githubRepoUrl' => $submission->getGithubRepoUrl(),
            'status' => $submission->getGrade() ? 'graded' : $submission->getStatus(),
            'submittedAt' => $submission->getSubmittedAt()->format(\DateTime::RFC3339),
            'updatedAt' => $submission->getUpdatedAt()->format(\DateTime::RFC3339),
            'attachments' => $attachments,
            'codeAnalysis' => $analysis
        ];
    }
}
