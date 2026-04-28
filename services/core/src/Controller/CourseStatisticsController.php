<?php

namespace App\Controller;

use App\Repository\CourseRepository;
use App\Service\CourseStatisticsService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/internal/courses')]
class CourseStatisticsController extends AbstractController
{
    private CourseRepository $courseRepository;
    private CourseStatisticsService $courseStatisticsService;

    public function __construct(
        CourseRepository $courseRepository,
        CourseStatisticsService $courseStatisticsService
    ) {
        $this->courseRepository = $courseRepository;
        $this->courseStatisticsService = $courseStatisticsService;
    }

    #[Route('/{id}/stats', name: 'internal_course_stats', methods: ['GET'])]
    public function getStats(int $id): JsonResponse
    {
        $course = $this->courseRepository->find($id);

        if (!$course || !$course->getIsActive()) {
            return $this->json(['error' => 'Course not found'], Response::HTTP_NOT_FOUND);
        }

        $stats = $this->courseStatisticsService->getCourseStats($id);

        return $this->json($stats, Response::HTTP_OK);
    }
}