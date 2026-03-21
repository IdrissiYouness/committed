<?php

namespace App\Controller;

use App\Entity\Announcement;
use App\Entity\AnnouncementAttachment;
use App\Repository\AnnouncementAttachmentRepository;
use App\Repository\AnnouncementRepository;
use App\Repository\CourseRepository;
use App\Repository\UserRepository;
use App\Service\FileStorageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class AnnouncementController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private AnnouncementRepository $announcementRepository;
    private AnnouncementAttachmentRepository $attachmentRepository;
    private CourseRepository $courseRepository;
    private UserRepository $userRepository;
    private FileStorageService $fileStorageService;

    public function __construct(
        EntityManagerInterface $entityManager,
        AnnouncementRepository $announcementRepository,
        AnnouncementAttachmentRepository $attachmentRepository,
        CourseRepository $courseRepository,
        UserRepository $userRepository,
        FileStorageService $fileStorageService
    ) {
        $this->entityManager = $entityManager;
        $this->announcementRepository = $announcementRepository;
        $this->attachmentRepository = $attachmentRepository;
        $this->courseRepository = $courseRepository;
        $this->userRepository = $userRepository;
        $this->fileStorageService = $fileStorageService;
    }

    #[Route('/internal/courses/{courseId}/announcements', name: 'internal_create_announcement', methods: ['POST'])]
    public function createAnnouncement(int $courseId, Request $request): JsonResponse
    {
        $course = $this->courseRepository->find($courseId);
        if (!$course) {
            return $this->json(['error' => 'Course not found'], Response::HTTP_NOT_FOUND);
        }

        $userId = $request->request->get('userId');
        $title = $request->request->get('title');
        $content = $request->request->get('content');

        if (!$userId || !$title || !$content) {
            return $this->json(['error' => 'Missing required fields: userId, title, content'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $announcement = new Announcement();
        $announcement->setCourse($course);
        $announcement->setPostedBy($user);
        $announcement->setTitle($title);
        $announcement->setContent($content);

        $this->entityManager->persist($announcement);

        $attachmentsData = [];
        $filesParam = $request->files->get('attachments');
        $files = is_array($filesParam) ? $filesParam : ($filesParam ? [$filesParam] : []);

        foreach ($files as $file) {
            if ($file) {
                try {
                    $fileData = $this->fileStorageService->uploadFile($file, 'announcements');
                    
                    $attachment = new AnnouncementAttachment();
                    $attachment->setAnnouncement($announcement);
                    $attachment->setFileName($fileData['fileName']);
                    $attachment->setFilePath($fileData['filePath']);
                    $attachment->setFileType($fileData['fileType']);
                    $attachment->setFileSize($fileData['fileSize']);
                    $attachment->setUploadedBy($user);

                    $this->entityManager->persist($attachment);
                    $attachmentsData[] = $attachment;
                } catch (\Exception $e) {
                    // Rollback uploaded files
                    foreach ($attachmentsData as $uploadedAttachment) {
                        try {
                            $this->fileStorageService->deleteFile($uploadedAttachment->getFilePath());
                        } catch (\Exception $cleanupEx) {
                            // Ignore cleanup errors
                        }
                    }
                    return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
                }
            }
        }

        $this->entityManager->flush();

        $result = $announcement->toArray();
        $result['attachments'] = array_map(fn($a) => $a->toArray(), $attachmentsData);

        return $this->json($result, Response::HTTP_CREATED);
    }

    #[Route('/internal/courses/{courseId}/announcements', name: 'internal_list_announcements', methods: ['GET'])]
    public function listAnnouncements(int $courseId, Request $request): JsonResponse
    {
        $course = $this->courseRepository->find($courseId);
        if (!$course) {
            return $this->json(['error' => 'Course not found'], Response::HTTP_NOT_FOUND);
        }

        $page = max(0, $request->query->getInt('page', 0));
        $size = max(1, $request->query->getInt('size', 20));
        $offset = $page * $size;

        $announcements = $this->announcementRepository->findByCourseId($courseId, $size, $offset);
        $total = $this->announcementRepository->countByCourseId($courseId);

        $data = [];
        foreach ($announcements as $announcement) {
            $item = $announcement->toArray();
            $attachments = $this->attachmentRepository->findByAnnouncementId($announcement->getAnnouncementId());
            $item['attachments'] = array_map(fn($a) => $a->toArray(), $attachments);
            $data[] = $item;
        }

        return $this->json([
            'data' => $data,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $size,
                'totalPages' => ceil($total / $size)
            ]
        ], Response::HTTP_OK);
    }

    #[Route('/internal/announcements/{id}', name: 'internal_update_announcement', methods: ['PUT'])]
    public function updateAnnouncement(int $id, Request $request): JsonResponse
    {
        $announcement = $this->announcementRepository->find($id);
        if (!$announcement) {
            return $this->json(['error' => 'Announcement not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (isset($data['title'])) {
            $announcement->setTitle($data['title']);
        }
        if (isset($data['content'])) {
            $announcement->setContent($data['content']);
        }

        $announcement->setUpdatedAt(new \DateTime());
        $this->entityManager->flush();

        $result = $announcement->toArray();
        $attachments = $this->attachmentRepository->findByAnnouncementId($id);
        $result['attachments'] = array_map(fn($a) => $a->toArray(), $attachments);

        return $this->json($result, Response::HTTP_OK);
    }

    #[Route('/internal/announcements/{id}', name: 'internal_delete_announcement', methods: ['DELETE'])]
    public function deleteAnnouncement(int $id): JsonResponse
    {
        $announcement = $this->announcementRepository->find($id);
        if (!$announcement) {
            return $this->json(['error' => 'Announcement not found'], Response::HTTP_NOT_FOUND);
        }

        $attachments = $this->attachmentRepository->findByAnnouncementId($id);

        foreach ($attachments as $attachment) {
            try {
                $this->fileStorageService->deleteFile($attachment->getFilePath());
                $this->entityManager->remove($attachment);
            } catch (\Exception $e) {
                return $this->json(['error' => 'Failed to delete attachment: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }

        $this->entityManager->remove($announcement);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/internal/files/{attachmentId}', name: 'internal_get_file_metadata', methods: ['GET'])]
    public function getFileMetadata(int $attachmentId): JsonResponse
    {
        $attachment = $this->attachmentRepository->find($attachmentId);
        if (!$attachment) {
            return $this->json(['error' => 'Attachment not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($attachment->toArray(), Response::HTTP_OK);
    }
}