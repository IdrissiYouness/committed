<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\SubmissionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: SubmissionRepository::class)]
#[ORM\Table(name: 'submission')]
#[ORM\Index(name: 'idx_submission_assignment', columns: ['assignment_id'])]
#[ORM\Index(name: 'idx_submission_student', columns: ['student_id'])]
#[ORM\Index(name: 'idx_submission_status', columns: ['status'])]
#[ORM\Index(name: 'idx_submission_submitted_at', columns: ['submitted_at'])]
class Submission
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'submission_id', type: Types::INTEGER)]
    private ?int $submissionId = null;

    #[ORM\ManyToOne(targetEntity: Assignment::class)]
    #[ORM\JoinColumn(name: 'assignment_id', referencedColumnName: 'assignment_id', nullable: false, onDelete: 'CASCADE')]
    private Assignment $assignment;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'student_id', referencedColumnName: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $student;

    #[ORM\Column(name: 'submission_text', type: Types::TEXT, nullable: true)]
    private ?string $submissionText = null;

    #[ORM\Column(name: 'github_repo_url', type: Types::STRING, length: 500, nullable: true)]
    private ?string $githubRepoUrl = null;

    #[ORM\Column(name: 'status', type: Types::STRING, length: 50, options: ['default' => 'pending'])]
    private string $status = 'pending';

    #[ORM\Column(name: 'submitted_at', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $submittedAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $updatedAt;

    #[ORM\OneToMany(mappedBy: 'submission', targetEntity: SubmissionAttachment::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $attachments;

    #[ORM\OneToOne(mappedBy: 'submission', targetEntity: CodeAnalysis::class, cascade: ['persist', 'remove'])]
    private ?CodeAnalysis $codeAnalysis = null;

    public function __construct()
    {
        $this->submittedAt = new \DateTime();
        $this->updatedAt = new \DateTime();
        $this->attachments = new ArrayCollection();
    }

    public function getSubmissionId(): ?int
    {
        return $this->submissionId;
    }

    public function getAssignment(): Assignment
    {
        return $this->assignment;
    }

    public function setAssignment(Assignment $assignment): self
    {
        $this->assignment = $assignment;
        return $this;
    }

    public function getStudent(): User
    {
        return $this->student;
    }

    public function setStudent(User $student): self
    {
        $this->student = $student;
        return $this;
    }

    public function getSubmissionText(): ?string
    {
        return $this->submissionText;
    }

    public function setSubmissionText(?string $submissionText): self
    {
        $this->submissionText = $submissionText;
        return $this;
    }

    public function getGithubRepoUrl(): ?string
    {
        return $this->githubRepoUrl;
    }

    public function setGithubRepoUrl(?string $githubRepoUrl): self
    {
        $this->githubRepoUrl = $githubRepoUrl;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function getSubmittedAt(): \DateTimeInterface
    {
        return $this->submittedAt;
    }

    public function setSubmittedAt(\DateTimeInterface $submittedAt): self
    {
        $this->submittedAt = $submittedAt;
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
     * @return Collection<int, SubmissionAttachment>
     */
    public function getAttachments(): Collection
    {
        return $this->attachments;
    }

    public function addAttachment(SubmissionAttachment $attachment): self
    {
        if (!$this->attachments->contains($attachment)) {
            $this->attachments->add($attachment);
            $attachment->setSubmission($this);
        }

        return $this;
    }

    public function removeAttachment(SubmissionAttachment $attachment): self
    {
        $this->attachments->removeElement($attachment);
        return $this;
    }

    public function getCodeAnalysis(): ?CodeAnalysis
    {
        return $this->codeAnalysis;
    }

    public function setCodeAnalysis(?CodeAnalysis $codeAnalysis): self
    {
        $this->codeAnalysis = $codeAnalysis;
        if ($codeAnalysis !== null && $codeAnalysis->getSubmission() !== $this) {
            $codeAnalysis->setSubmission($this);
        }
        return $this;
    }
}
