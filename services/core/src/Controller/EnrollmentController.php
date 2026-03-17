<?php

namespace App\Controller;

use App\Entity\Course;
use App\Entity\Enrollment;
use App\Entity\User;
use App\Repository\CourseRepository;
use App\Repository\EnrollmentRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/internal/courses')]
class EnrollmentController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private CourseRepository $courseRepository;
    private UserRepository $userRepository;
    private EnrollmentRepository $enrollmentRepository;

    public function __construct(
        EntityManagerInterface $entityManager,
        CourseRepository $courseRepository,
        UserRepository $userRepository,
        EnrollmentRepository $enrollmentRepository
    ) {
        $this->entityManager = $entityManager;
        $this->courseRepository = $courseRepository;
        $this->userRepository = $userRepository;
        $this->enrollmentRepository = $enrollmentRepository;
    }

    #[Route('/enroll', name: 'internal_course_enroll', methods: ['POST'])]
    public function enroll(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['courseCode'], $data['userId'])) {
            return $this->json(['error' => 'Missing required fields: courseCode, userId'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->userRepository->find($data['userId']);
        if (!$user) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $course = $this->courseRepository->findOneBy(['courseCode' => $data['courseCode']]);
        if (!$course || !$course->getIsActive()) {
            return $this->json(['error' => 'Course not found or inactive'], Response::HTTP_NOT_FOUND);
        }

        if (!$course->getIsOpen()) {
            return $this->json(['error' => 'Course is closed for enrollment'], Response::HTTP_BAD_REQUEST);
        }

        if ($course->getTeacher()->getUserId() === $user->getUserId()) {
            return $this->json(['error' => 'Teacher cannot enroll as a student in their own course'], Response::HTTP_BAD_REQUEST);
        }

        $existingEnrollment = $this->enrollmentRepository->findOneByCourseAndUser($course->getCourseId(), $user->getUserId());
        if ($existingEnrollment) {
            return $this->json(['error' => 'User is already enrolled in this course'], Response::HTTP_CONFLICT);
        }

        $enrollment = new Enrollment();
        $enrollment->setUser($user);
        $enrollment->setCourse($course);
        $enrollment->setCourseRole('student');

        $this->entityManager->persist($enrollment);
        $this->entityManager->flush();

        return $this->json(['message' => 'Successfully enrolled in course'], Response::HTTP_CREATED);
    }

    #[Route('/{courseId}/enroll/{userId}', name: 'internal_course_unenroll', methods: ['DELETE'])]
    public function unenroll(int $courseId, int $userId): JsonResponse
    {
        $enrollment = $this->enrollmentRepository->findOneByCourseAndUser($courseId, $userId);

        if (!$enrollment) {
            return $this->json(['error' => 'Enrollment not found'], Response::HTTP_NOT_FOUND);
        }

        if ($enrollment->getCourseRole() === 'professor') {
            return $this->json(['error' => 'Professor cannot unenroll from their own course'], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->remove($enrollment);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{courseId}/students', name: 'internal_course_students', methods: ['GET'])]
    public function getStudents(int $courseId): JsonResponse
    {
        $course = $this->courseRepository->find($courseId);
        
        if (!$course || !$course->getIsActive()) {
            return $this->json(['error' => 'Course not found'], Response::HTTP_NOT_FOUND);
        }

        $students = $this->enrollmentRepository->findStudentsByCourseId($courseId);

        $data = array_map(function (User $user) {
            return [
                'userId' => $user->getUserId(),
                'fullName' => $user->getFullName(),
                'email' => $user->getEmail()
            ];
        }, $students);

        return $this->json($data, Response::HTTP_OK);
    }
}