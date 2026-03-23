<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\AssignmentRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: AssignmentRepository::class)]
#[ORM\Table(name: 'assignment')]
#[ORM\Index(name: 'idx_assignment_created_by', columns: ['created_by'])]
#[ORM\Index(name: 'idx_assignment_course', columns: ['course_id'])]
#[ORM\Index(name: 'idx_assignment_due_date', columns: ['due_date'])]
class Assignment
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'assignment_id', type: Types::INTEGER)]
    private ?int $assignmentId = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', referencedColumnName: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $createdBy;

    #[ORM\ManyToOne(targetEntity: Course::class)]
    #[ORM\JoinColumn(name: 'course_id', referencedColumnName: 'course_id', nullable: false, onDelete: 'CASCADE')]
    private Course $course;

    #[ORM\Column(name: 'title', type: Types::STRING, length: 500)]
    private string $title;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'max_points', type: Types::DECIMAL, precision: 6, scale: 2, options: ['default' => '100.00'])]
    private string $maxPoints = '100.00';

    #[ORM\Column(name: 'due_date', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dueDate = null;

    #[ORM\Column(name: 'allow_late_submission', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $allowLateSubmission = false;

    #[ORM\Column(name: 'require_github_repo', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $requireGithubRepo = false;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $updatedAt;

    #[ORM\OneToMany(mappedBy: 'assignment', targetEntity: AssignmentAttachment::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $attachments;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
        $this->attachments = new ArrayCollection();
    }

    public function getAssignmentId(): ?int
    {
        return $this->assignmentId;
    }

    public function getCreatedBy(): User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(User $createdBy): self
    {
        $this->createdBy = $createdBy;
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

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function getMaxPoints(): string
    {
        return $this->maxPoints;
    }

    public function setMaxPoints(string $maxPoints): self
    {
        $this->maxPoints = $maxPoints;
        return $this;
    }

    public function getDueDate(): ?\DateTimeInterface
    {
        return $this->dueDate;
    }

    public function setDueDate(?\DateTimeInterface $dueDate): self
    {
        $this->dueDate = $dueDate;
        return $this;
    }

    public function isAllowLateSubmission(): bool
    {
        return $this->allowLateSubmission;
    }

    public function setAllowLateSubmission(bool $allowLateSubmission): self
    {
        $this->allowLateSubmission = $allowLateSubmission;
        return $this;
    }

    public function isRequireGithubRepo(): bool
    {
        return $this->requireGithubRepo;
    }

    public function setRequireGithubRepo(bool $requireGithubRepo): self
    {
        $this->requireGithubRepo = $requireGithubRepo;
        return $this;
    }

    public function getCreatedAt(): \DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): \DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeInterface $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    /**
     * @return Collection<int, AssignmentAttachment>
     */
    public function getAttachments(): Collection
    {
        return $this->attachments;
    }

    public function addAttachment(AssignmentAttachment $attachment): self
    {
        if (!$this->attachments->contains($attachment)) {
            $this->attachments->add($attachment);
            $attachment->setAssignment($this);
        }

        return $this;
    }

    public function removeAttachment(AssignmentAttachment $attachment): self
    {
        if ($this->attachments->removeElement($attachment)) {
            // set the owning side to null (unless already changed)
            if ($attachment->getAssignment() === $this) {
                // Not strictly necessary due to cascade/orphanRemoval handling, 
                // but standard practice if you wanted to allow un-attaching without deleting.
            }
        }

        return $this;
    }
}