<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\EnrollmentRepository;

#[ORM\Entity(repositoryClass: EnrollmentRepository::class)]
#[ORM\Table(name: 'enrollment')]
#[ORM\Index(name: 'idx_enrollment_user', columns: ['user_id'])]
#[ORM\Index(name: 'idx_enrollment_course', columns: ['course_id'])]
#[ORM\Index(name: 'idx_enrollment_role', columns: ['course_role'])]
class Enrollment
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Course::class)]
    #[ORM\JoinColumn(name: 'course_id', referencedColumnName: 'course_id', nullable: false, onDelete: 'CASCADE')]
    private Course $course;

    #[ORM\Column(name: 'course_role', type: Types::STRING, length: 20, options: ['default' => 'student'])]
    private string $courseRole = 'student';

    #[ORM\Column(name: 'enrolled_at', type: Types::DATETIME_MUTABLE)]
    private \DateTime $enrolledAt;

    public function __construct()
    {
        $this->enrolledAt = new \DateTime();
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): self
    {
        $this->user = $user;
        return $this;
    }

    public function getCourse(): Course
    {
        return $this->course;
    }

    public function setCourse(Course $course): self
    {
        $this->course = $course;
        return $this;
    }

    public function getCourseRole(): string
    {
        return $this->courseRole;
    }

    public function setCourseRole(string $courseRole): self
    {
        $this->courseRole = $courseRole;
        return $this;
    }

    public function getEnrolledAt(): \DateTime
    {
        return $this->enrolledAt;
    }

    public function setEnrolledAt(\DateTime $enrolledAt): self
    {
        $this->enrolledAt = $enrolledAt;
        return $this;
    }

    public function toArray(): array
    {
        return [
            'userId' => $this->user->getUserId(),
            'courseId' => $this->course->getCourseId(),
            'courseRole' => $this->courseRole,
            'enrolledAt' => $this->enrolledAt->format(\DateTime::ATOM),
        ];
    }
}