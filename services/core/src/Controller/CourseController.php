<?php

namespace App\Controller;

use App\Entity\Course;
use App\Entity\Enrollment;
use App\Repository\CourseRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/internal/courses')]
class CourseController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private CourseRepository $courseRepository;
    private UserRepository $userRepository;

    public function __construct(
        EntityManagerInterface $entityManager,
        CourseRepository $courseRepository,
        UserRepository $userRepository
    ) {
        $this->entityManager = $entityManager;
        $this->courseRepository = $courseRepository;
        $this->userRepository = $userRepository;
    }

    #[Route('', name: 'internal_course_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $userId = $request->query->get('userId');

        if ($userId) {
            $courses = $this->courseRepository->findActiveEnrolledCoursesByUserId((int) $userId);
        } else {
            $courses = $this->courseRepository->findBy(['isActive' => true]);
        }

        $data = array_map(fn(Course $course) => $course->toArray(), $courses);

        return $this->json($data, Response::HTTP_OK);
    }

    #[Route('', name: 'internal_course_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['courseCode'], $data['courseName'], $data['teacherId'])) {
            return $this->json(['error' => 'Missing required fields: courseCode, courseName, teacherId'], Response::HTTP_BAD_REQUEST);
        }

        // Check if course code already exists
        $existingCourse = $this->courseRepository->findOneBy(['courseCode' => $data['courseCode']]);
        if ($existingCourse) {
            return $this->json(['error' => 'Course code already exists'], Response::HTTP_CONFLICT);
        }

        $teacher = $this->userRepository->find($data['teacherId']);
        if (!$teacher) {
            return $this->json(['error' => 'Teacher not found'], Response::HTTP_NOT_FOUND);
        }

        $course = new Course();
        $course->setCourseCode($data['courseCode']);
        $course->setCourseName($data['courseName']);
        $course->setTeacher($teacher);

        if (isset($data['description'])) {
            $course->setDescription($data['description']);
        }
        if (isset($data['section'])) {
            $course->setSection($data['section']);
        }
        if (isset($data['subject'])) {
            $course->setSubject($data['subject']);
        }

        $this->entityManager->persist($course);

        // Auto-enroll the teacher as a professor in the course
        $enrollment = new Enrollment();
        $enrollment->setUser($teacher);
        $enrollment->setCourse($course);
        $enrollment->setCourseRole('professor');
        
        $this->entityManager->persist($enrollment);
        $this->entityManager->flush();

        return $this->json($course->toArray(), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'internal_course_get', methods: ['GET'])]
    public function getCourse(int $id): JsonResponse
    {
        $course = $this->courseRepository->find($id);

        if (!$course || !$course->getIsActive()) {
            return $this->json(['error' => 'Course not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($course->toArray(), Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'internal_course_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $course = $this->courseRepository->find($id);

        if (!$course || !$course->getIsActive()) {
            return $this->json(['error' => 'Course not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        // Gateway should handle authorization (ensuring only the owner can update)
        // We will just process the update here.
        if (isset($data['courseName'])) {
            $course->setCourseName($data['courseName']);
        }
        if (isset($data['description'])) {
            $course->setDescription($data['description']);
        }
        if (array_key_exists('section', $data)) {
            $course->setSection($data['section']);
        }
        if (array_key_exists('subject', $data)) {
            $course->setSubject($data['subject']);
        }
        if (isset($data['isOpen'])) {
            $course->setIsOpen((bool)$data['isOpen']);
        }

        $course->setUpdatedAt(new \DateTime());

        $this->entityManager->flush();

        return $this->json($course->toArray(), Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'internal_course_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $course = $this->courseRepository->find($id);

        if (!$course || !$course->getIsActive()) {
            return $this->json(['error' => 'Course not found'], Response::HTTP_NOT_FOUND);
        }

        // Soft delete
        $course->setIsActive(false);
        $course->setUpdatedAt(new \DateTime());
        
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}