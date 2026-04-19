<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\GradeRepository;

#[ORM\Entity(repositoryClass: GradeRepository::class)]
#[ORM\Table(name: 'grade')]
#[ORM\Index(name: 'idx_grade_submission', columns: ['submission_id'])]
#[ORM\Index(name: 'idx_grade_graded_by', columns: ['graded_by'])]
#[ORM\Index(name: 'idx_grade_graded_at', columns: ['graded_at'])]
class Grade
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'grade_id', type: Types::INTEGER)]
    private ?int $gradeId = null;

    #[ORM\OneToOne(targetEntity: Submission::class)]
    #[ORM\JoinColumn(name: 'submission_id', referencedColumnName: 'submission_id', nullable: false, onDelete: 'CASCADE')]
    private Submission $submission;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'graded_by', referencedColumnName: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $gradedBy;

    #[ORM\Column(name: 'points_earned', type: Types::DECIMAL, precision: 6, scale: 2)]
    private string $pointsEarned;

    #[ORM\Column(name: 'max_points', type: Types::DECIMAL, precision: 6, scale: 2)]
    private string $maxPoints;

    #[ORM\Column(name: 'feedback', type: Types::TEXT, nullable: true)]
    private ?string $feedback = null;

    #[ORM\Column(name: 'graded_at', type: Types::DATETIME_MUTABLE, options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTimeInterface $gradedAt;

    #[ORM\Column(name: 'source', type: Types::STRING, length: 20, options: ['default' => 'manual'])]
    private string $source = 'manual';

    #[ORM\Column(name: 'is_finalized', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $isFinalized = false;

    public function __construct()
    {
        $this->gradedAt = new \DateTime();
    }

    public function getGradeId(): ?int
    {
        return $this->gradeId;
    }

    public function getSubmission(): Submission
    {
        return $this->submission;
    }

    public function setSubmission(Submission $submission): self
    {
        $this->submission = $submission;
        return $this;
    }

    public function getGradedBy(): User
    {
        return $this->gradedBy;
    }

    public function setGradedBy(User $gradedBy): self
    {
        $this->gradedBy = $gradedBy;
        return $this;
    }

    public function getPointsEarned(): string
    {
        return $this->pointsEarned;
    }

    public function setPointsEarned(string $pointsEarned): self
    {
        $this->pointsEarned = $pointsEarned;
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

    public function getFeedback(): ?string
    {
        return $this->feedback;
    }

    public function setFeedback(?string $feedback): self
    {
        $this->feedback = $feedback;
        return $this;
    }

    public function getGradedAt(): \DateTimeInterface
    {
        return $this->gradedAt;
    }

    public function setGradedAt(\DateTimeInterface $gradedAt): self
    {
        $this->gradedAt = $gradedAt;
        return $this;
    }

    public function getSource(): string
    {
        return $this->source;
    }

    public function setSource(string $source): self
    {
        $this->source = $source;
        return $this;
    }

    public function isFinalized(): bool
    {
        return $this->isFinalized;
    }

    public function setIsFinalized(bool $isFinalized): self
    {
        $this->isFinalized = $isFinalized;
        return $this;
    }
}