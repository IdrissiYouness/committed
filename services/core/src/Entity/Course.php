<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\CourseRepository;

#[ORM\Entity(repositoryClass: CourseRepository::class)]
#[ORM\Table(name: 'course')]
#[ORM\Index(name: 'idx_course_code', columns: ['course_code'])]
#[ORM\Index(name: 'idx_course_teacher', columns: ['teacher_id'])]
#[ORM\Index(name: 'idx_course_is_active', columns: ['is_active'])]
class Course
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'course_id', type: Types::INTEGER)]
    private ?int $courseId = null;

    #[ORM\Column(name: 'course_code', type: Types::STRING, length: 50, unique: true)]
    private string $courseCode;

    #[ORM\Column(name: 'course_name', type: Types::STRING, length: 255)]
    private string $courseName;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'section', type: Types::STRING, length: 50, nullable: true)]
    private ?string $section = null;

    #[ORM\Column(name: 'subject', type: Types::STRING, length: 100, nullable: true)]
    private ?string $subject = null;

    #[ORM\Column(name: 'is_open', type: Types::BOOLEAN, options: ['default' => true])]
    private bool $isOpen = true;

    #[ORM\Column(name: 'is_active', type: Types::BOOLEAN, options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'teacher_id', referencedColumnName: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $teacher;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private \DateTime $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private \DateTime $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    public function getCourseId(): ?int { return $this->courseId; }

    public function getCourseCode(): string { return $this->courseCode; }
    public function setCourseCode(string $courseCode): self { $this->courseCode = $courseCode; return $this; }

    public function getCourseName(): string { return $this->courseName; }
    public function setCourseName(string $courseName): self { $this->courseName = $courseName; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): self { $this->description = $description; return $this; }

    public function getSection(): ?string { return $this->section; }
    public function setSection(?string $section): self { $this->section = $section; return $this; }

    public function getSubject(): ?string { return $this->subject; }
    public function setSubject(?string $subject): self { $this->subject = $subject; return $this; }

    public function getIsOpen(): bool { return $this->isOpen; }
    public function setIsOpen(bool $isOpen): self { $this->isOpen = $isOpen; return $this; }

    public function getIsActive(): bool { return $this->isActive; }
    public function setIsActive(bool $isActive): self { $this->isActive = $isActive; return $this; }

    public function getTeacher(): User { return $this->teacher; }
    public function setTeacher(User $teacher): self { $this->teacher = $teacher; return $this; }

    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }

    public function getUpdatedAt(): \DateTime { return $this->updatedAt; }
    public function setUpdatedAt(\DateTime $updatedAt): self { $this->updatedAt = $updatedAt; return $this; }

    public function toArray(): array
    {
        return [
            'courseId' => $this->courseId,
            'courseCode' => $this->courseCode,
            'courseName' => $this->courseName,
            'description' => $this->description,
            'section' => $this->section,
            'subject' => $this->subject,
            'isOpen' => $this->isOpen,
            'isActive' => $this->isActive,
            'teacher' => isset($this->teacher) ? [
                'userId' => $this->teacher->getUserId(),
                'fullName' => $this->teacher->getFullName(),
                'email' => $this->teacher->getEmail()
            ] : null,
            'createdAt' => $this->createdAt->format(\DateTime::ATOM),
            'updatedAt' => $this->updatedAt->format(\DateTime::ATOM),
        ];
    }
}