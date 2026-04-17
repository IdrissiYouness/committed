<?php

namespace App\Controller;

use App\Entity\Assignment;
use App\Entity\AssignmentAttachment;
use App\Entity\Course;
use App\Entity\User;
use App\Repository\AssignmentRepository;
use App\Service\FileStorageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class AssignmentController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private AssignmentRepository $assignmentRepository;
    private FileStorageService $fileStorageService;

    public function __construct(
        EntityManagerInterface $entityManager,
        AssignmentRepository $assignmentRepository,
        FileStorageService $fileStorageService
    ) {
        $this->entityManager = $entityManager;
        $this->assignmentRepository = $assignmentRepository;
        $this->fileStorageService = $fileStorageService;
    }

    #[Route('/internal/courses/{courseId}/assignments', name: 'internal_create_assignment', methods: ['POST'])]
    public function createAssignment(int $courseId, Request $request): JsonResponse
    {
        $userId = $request->headers->get('X-User-Id');
        if (!$userId) {
            return $this->json(['error' => 'User ID is required'], 401);
        }

        $user = $this->entityManager->getRepository(User::class)->find($userId);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $course = $this->entityManager->getRepository(Course::class)->find($courseId);
        if (!$course) {
            return $this->json(['error' => 'Course not found'], 404);
        }

        $title = $request->request->get('title');
        
        if (empty($title)) {
            return $this->json(['error' => 'Title is required'], 400);
        }

        $assignment = new Assignment();
        $assignment->setCourse($course);
        $assignment->setCreatedBy($user);
        $assignment->setTitle($title);
        
        $description = $request->request->get('description');
        if ($description !== null) {
            $assignment->setDescription($description);
        }
        
        $dueDateRaw = $request->request->get('dueDate');
        if (!empty($dueDateRaw)) {
            try {
                $dueDate = new \DateTime($dueDateRaw);
                if ($dueDate < new \DateTime()) {
                    return $this->json(['error' => 'Due date cannot be in the past'], 400);
                }
                $assignment->setDueDate($dueDate);
            } catch (\Exception $e) {
                return $this->json(['error' => 'Invalid due date format'], 400);
            }
        }
        
        $maxPoints = $request->request->get('maxPoints');
        if ($maxPoints !== null) {
            $assignment->setMaxPoints((string) $maxPoints);
        }

        $allowLate = $request->request->get('allowLateSubmission');
        if ($allowLate !== null) {
            $assignment->setAllowLateSubmission(filter_var($allowLate, FILTER_VALIDATE_BOOLEAN));
        }

        $requireGithub = $request->request->get('requireGithubRepo');
        if ($requireGithub !== null) {
            $assignment->setRequireGithubRepo(filter_var($requireGithub, FILTER_VALIDATE_BOOLEAN));
        }

        $this->entityManager->persist($assignment);

        $attachmentsData = [];
        $filesParam = $request->files->get('attachments');
        $files = is_array($filesParam) ? $filesParam : ($filesParam ? [$filesParam] : []);

        foreach ($files as $file) {
            if ($file) {
                try {
                    $fileData = $this->fileStorageService->uploadFile($file, 'assignments');

                    $attachment = new AssignmentAttachment();
                    $attachment->setAssignment($assignment);
                    $attachment->setFileName($fileData['fileName']);
                    $attachment->setFilePath($fileData['filePath']);
                    $attachment->setFileType($fileData['fileType']);
                    $attachment->setFileSize($fileData['fileSize']);
                    $attachment->setUploadedBy($user);

                    $this->entityManager->persist($attachment);
                    $attachmentsData[] = $attachment;
                    $assignment->addAttachment($attachment);
                } catch (\Exception $e) {
                    // Rollback uploaded files
                    foreach ($attachmentsData as $uploadedAttachment) {
                        try {
                            $this->fileStorageService->deleteFile($uploadedAttachment->getFilePath());
                        } catch (\Exception $cleanupEx) {
                            // Ignore cleanup errors
                        }
                    }
                    return $this->json(['error' => $e->getMessage()], 400);
                }
            }
        }

        $this->entityManager->flush();

        return $this->json($this->formatAssignment($assignment), 201);
    }

    #[Route('/internal/courses/{courseId}/assignments', name: 'internal_list_assignments', methods: ['GET'])]
    public function listAssignments(int $courseId, Request $request): JsonResponse
    {
        $course = $this->entityManager->getRepository(Course::class)->find($courseId);
        if (!$course) {
            return $this->json(['error' => 'Course not found'], 404);
        }

        $page = max(0, $request->query->getInt('page', 0));
        $size = max(1, $request->query->getInt('size', 20));

        $result = $this->assignmentRepository->findByCourseWithPagination($courseId, $page, $size);

        $formattedData = array_map(function (Assignment $assignment) {
            return $this->formatAssignment($assignment);
        }, $result['data']);

        return $this->json([
            'content' => $formattedData,
            'pageable' => [
                'pageNumber' => $result['page'],
                'pageSize' => $result['size'],
            ],
            'totalElements' => $result['total'],
            'totalPages' => $result['totalPages'],
            'last' => $result['page'] >= ($result['totalPages'] - 1)
        ]);
    }

    #[Route('/internal/assignments/{id}', name: 'internal_get_assignment', methods: ['GET'])]
    public function getAssignment(int $id): JsonResponse
    {
        $assignment = $this->assignmentRepository->find($id);
        if (!$assignment) {
            return $this->json(['error' => 'Assignment not found'], 404);
        }

        return $this->json($this->formatAssignment($assignment));
    }

    #[Route('/internal/assignments/{id}', name: 'internal_update_assignment', methods: ['PUT', 'POST'])]
    public function updateAssignment(int $id, Request $request): JsonResponse
    {
        $userId = $request->headers->get('X-User-Id');
        if (!$userId) {
            return $this->json(['error' => 'User ID is required'], 401);
        }

        $assignment = $this->assignmentRepository->find($id);
        if (!$assignment) {
            return $this->json(['error' => 'Assignment not found'], 404);
        }

        if ($assignment->getCreatedBy()->getUserId() !== (int)$userId) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        $contentType = $request->headers->get('Content-Type', '');
        if (str_starts_with($contentType, 'application/json')) {
            $data = json_decode($request->getContent(), true) ?? [];
            $removeAttachmentIds = $data['removeAttachmentIds'] ?? [];
        } else {
            $data = $request->request->all();
            $removeParam = $request->request->get('removeAttachmentIds');
            $removeAttachmentIds = is_array($removeParam) ? $removeParam : ($removeParam ? [$removeParam] : []);
        }

        if (isset($data['title'])) {
            if (empty($data['title'])) {
                return $this->json(['error' => 'Title cannot be empty'], 400);
            }
            $assignment->setTitle($data['title']);
        }

        if (array_key_exists('description', $data)) {
            $assignment->setDescription($data['description']);
        }

        if (array_key_exists('dueDate', $data)) {
            if (empty($data['dueDate'])) {
                $assignment->setDueDate(null);
            } else {
                try {
                    $dueDate = new \DateTime($data['dueDate']);
                    $assignment->setDueDate($dueDate);
                } catch (\Exception $e) {
                    return $this->json(['error' => 'Invalid due date format'], 400);
                }
            }
        }

        if (isset($data['maxPoints'])) {
            $assignment->setMaxPoints((string) $data['maxPoints']);
        }

        if (isset($data['allowLateSubmission'])) {
            $assignment->setAllowLateSubmission(filter_var($data['allowLateSubmission'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($data['requireGithubRepo'])) {
            $assignment->setRequireGithubRepo(filter_var($data['requireGithubRepo'], FILTER_VALIDATE_BOOLEAN));
        }

        $assignment->setUpdatedAt(new \DateTime());

        $filesParam = $request->files->get('attachments') ?? $request->files->get('files');
        $files = is_array($filesParam) ? $filesParam : ($filesParam ? [$filesParam] : []);

        foreach ($files as $file) {
            if ($file) {
                try {
                    $fileData = $this->fileStorageService->uploadFile($file, 'assignments');

                    $attachment = new AssignmentAttachment();
                    $attachment->setAssignment($assignment);
                    $attachment->setFileName($fileData['fileName']);
                    $attachment->setFilePath($fileData['filePath']);
                    $attachment->setFileType($fileData['fileType']);
                    $attachment->setFileSize($fileData['fileSize']);
                    $attachment->setUploadedBy($assignment->getCreatedBy());

                    $this->entityManager->persist($attachment);
                    $assignment->addAttachment($attachment);
                } catch (\Exception $e) {
                    return $this->json(['error' => 'Failed to upload attachment: ' . $e->getMessage()], 400);
                }
            }
        }

        if (!empty($removeAttachmentIds)) {
            $existingAttachments = $assignment->getAttachments();
            foreach ($existingAttachments as $attachment) {
                if (in_array($attachment->getAttachmentId(), $removeAttachmentIds)) {
                    try {
                        $this->fileStorageService->deleteFile($attachment->getFilePath());
                        $assignment->removeAttachment($attachment);
                        $this->entityManager->remove($attachment);
                    } catch (\Exception $e) {
                        return $this->json(['error' => 'Failed to delete attachment: ' . $e->getMessage()], 500);
                    }
                }
            }
        }

        $this->assignmentRepository->save($assignment, true);

        return $this->json($this->formatAssignment($assignment));
    }

    #[Route('/internal/assignments/{id}', name: 'internal_delete_assignment', methods: ['DELETE'])]
    public function deleteAssignment(int $id, Request $request): JsonResponse
    {
        $userId = $request->headers->get('X-User-Id');
        if (!$userId) {
            return $this->json(['error' => 'User ID is required'], 401);
        }

        $assignment = $this->assignmentRepository->find($id);
        if (!$assignment) {
            return $this->json(['error' => 'Assignment not found'], 404);
        }

        if ($assignment->getCreatedBy()->getUserId() !== (int)$userId) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        $this->assignmentRepository->remove($assignment, true);

        return new JsonResponse(null, 204);
    }

    private function formatAssignment(Assignment $assignment): array
    {
        $attachments = array_map(function (AssignmentAttachment $attachment) {
            return [
                'id' => $attachment->getAttachmentId(),
                'fileName' => $attachment->getFileName(),
                'filePath' => $attachment->getFilePath(),
                'fileType' => $attachment->getFileType(),
                'fileSize' => $attachment->getFileSize() ? (int)$attachment->getFileSize() : null,
                'uploadedBy' => $attachment->getUploadedBy()->getUserId(),
                'uploadedAt' => $attachment->getUploadedAt()->format(\DateTimeInterface::ATOM)
            ];
        }, $assignment->getAttachments()->toArray());

        return [
            'id' => $assignment->getAssignmentId(),
            'courseId' => $assignment->getCourse()->getCourseId(),
            'createdBy' => $assignment->getCreatedBy()->getUserId(),
            'title' => $assignment->getTitle(),
            'description' => $assignment->getDescription(),
            'maxPoints' => (float) $assignment->getMaxPoints(),
            'dueDate' => $assignment->getDueDate() ? $assignment->getDueDate()->format(\DateTimeInterface::ATOM) : null,
            'allowLateSubmission' => $assignment->isAllowLateSubmission(),
            'requireGithubRepo' => $assignment->isRequireGithubRepo(),
            'createdAt' => $assignment->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $assignment->getUpdatedAt()->format(\DateTimeInterface::ATOM),
            'attachments' => array_values($attachments)
        ];
    }
}