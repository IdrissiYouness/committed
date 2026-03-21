<?php

namespace App\Controller;

use App\Entity\Comment;
use App\Repository\AnnouncementRepository;
use App\Repository\CommentRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/internal')]
class CommentController extends AbstractController
{
    #[Route('/announcements/{announcementId}/comments', name: 'internal_create_comment', methods: ['POST'])]
    public function createComment(
        int $announcementId,
        Request $request,
        EntityManagerInterface $entityManager,
        AnnouncementRepository $announcementRepository,
        UserRepository $userRepository,
        CommentRepository $commentRepository
    ): JsonResponse {
        $userId = $request->headers->get('X-User-Id');
        if (!$userId) {
            return new JsonResponse(['error' => 'Missing X-User-Id header'], Response::HTTP_UNAUTHORIZED);
        }

        $announcement = $announcementRepository->find($announcementId);
        if (!$announcement) {
            return new JsonResponse(['error' => 'Announcement not found'], Response::HTTP_NOT_FOUND);
        }

        $user = $userRepository->find($userId);
        if (!$user) {
            return new JsonResponse(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!isset($data['content']) || trim($data['content']) === '') {
            return new JsonResponse(['error' => 'Comment content cannot be empty'], Response::HTTP_BAD_REQUEST);
        }

        $comment = new Comment();
        $comment->setAnnouncement($announcement);
        $comment->setUser($user);
        $comment->setContent(trim($data['content']));

        if (isset($data['parentCommentId']) && $data['parentCommentId'] !== null) {
            $parentComment = $commentRepository->find($data['parentCommentId']);
            if (!$parentComment) {
                return new JsonResponse(['error' => 'Parent comment not found'], Response::HTTP_BAD_REQUEST);
            }
            // Ensure parent comment belongs to the same announcement
            if ($parentComment->getAnnouncement()->getAnnouncementId() !== $announcementId) {
                return new JsonResponse(['error' => 'Parent comment does not belong to this announcement'], Response::HTTP_BAD_REQUEST);
            }
            $comment->setParentComment($parentComment);
        }

        $entityManager->persist($comment);
        $entityManager->flush();

        return new JsonResponse($comment->toArray(), Response::HTTP_CREATED);
    }

    #[Route('/announcements/{announcementId}/comments', name: 'internal_list_comments', methods: ['GET'])]
    public function listComments(
        int $announcementId,
        Request $request,
        AnnouncementRepository $announcementRepository,
        CommentRepository $commentRepository
    ): JsonResponse {
        $announcement = $announcementRepository->find($announcementId);
        if (!$announcement) {
            return new JsonResponse(['error' => 'Announcement not found'], Response::HTTP_NOT_FOUND);
        }

        // Using 0-indexed pagination to align with Spring Boot
        $page = max(0, $request->query->getInt('page', 0));
        $size = max(1, $request->query->getInt('size', 20));

        $paginator = $commentRepository->findByAnnouncementPaginated($announcementId, $page, $size);
        $totalElements = count($paginator);

        $commentsArray = [];
        foreach ($paginator as $comment) {
            $commentsArray[] = $comment->toArray();
        }

        $totalPages = $size > 0 ? ceil($totalElements / $size) : 0;

        return new JsonResponse([
            'data' => $commentsArray,
            'meta' => [
                'total' => $totalElements,
                'page' => $page,
                'limit' => $size,
                'totalPages' => $totalPages
            ]
        ], Response::HTTP_OK);
    }

    #[Route('/comments/{commentId}', name: 'internal_update_comment', methods: ['PUT'])]
    public function updateComment(
        int $commentId,
        Request $request,
        EntityManagerInterface $entityManager,
        CommentRepository $commentRepository
    ): JsonResponse {
        $userId = $request->headers->get('X-User-Id');
        if (!$userId) {
            return new JsonResponse(['error' => 'Missing X-User-Id header'], Response::HTTP_UNAUTHORIZED);
        }

        $comment = $commentRepository->find($commentId);
        if (!$comment) {
            return new JsonResponse(['error' => 'Comment not found'], Response::HTTP_NOT_FOUND);
        }

        // Verify ownership
        if ($comment->getUser()->getUserId() !== (int)$userId) {
            return new JsonResponse(['error' => 'You are not authorized to update this comment'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        if (!isset($data['content']) || trim($data['content']) === '') {
            return new JsonResponse(['error' => 'Comment content cannot be empty'], Response::HTTP_BAD_REQUEST);
        }

        $comment->setContent(trim($data['content']));
        $comment->setUpdatedAt(new \DateTime());

        $entityManager->flush();

        return new JsonResponse($comment->toArray(), Response::HTTP_OK);
    }

    #[Route('/comments/{commentId}', name: 'internal_delete_comment', methods: ['DELETE'])]
    public function deleteComment(
        int $commentId,
        Request $request,
        EntityManagerInterface $entityManager,
        CommentRepository $commentRepository
    ): JsonResponse {
        $userId = $request->headers->get('X-User-Id');
        if (!$userId) {
            return new JsonResponse(['error' => 'Missing X-User-Id header'], Response::HTTP_UNAUTHORIZED);
        }

        $comment = $commentRepository->find($commentId);
        if (!$comment) {
            return new JsonResponse(null, Response::HTTP_NO_CONTENT);
        }

        // Verify ownership (or allow admins - this internal endpoint expects Gateway to enforce standard roles, 
        // but Core enforces ownership strictly. If Admin needs to delete, Gateway might need a bypass, 
        // but for now, strict ownership is fine as per spec).
        if ($comment->getUser()->getUserId() !== (int)$userId) {
            return new JsonResponse(['error' => 'You are not authorized to delete this comment'], Response::HTTP_FORBIDDEN);
        }

        $entityManager->remove($comment);
        $entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}