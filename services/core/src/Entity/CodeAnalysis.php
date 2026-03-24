<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\CodeAnalysisRepository;

#[ORM\Entity(repositoryClass: CodeAnalysisRepository::class)]
#[ORM\Table(name: 'code_analysis')]
#[ORM\Index(name: 'idx_code_analysis_submission', columns: ['submission_id'])]
#[ORM\Index(name: 'idx_code_analysis_status', columns: ['status'])]
class CodeAnalysis
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'analysis_id', type: Types::INTEGER)]
    private ?int $analysisId = null;

    #[ORM\OneToOne(targetEntity: Submission::class, inversedBy: 'codeAnalysis')]
    #[ORM\JoinColumn(name: 'submission_id', referencedColumnName: 'submission_id', nullable: false, onDelete: 'CASCADE')]
    private Submission $submission;

    #[ORM\Column(name: 'status', type: Types::STRING, length: 50, options: ['default' => 'pending'])]
    private string $status = 'pending';

    #[ORM\Column(name: 'metrics_data', type: Types::TEXT, nullable: true)]
    private ?string $metricsData = null;

    #[ORM\Column(name: 'report_pdf_url', type: Types::STRING, length: 500, nullable: true)]
    private ?string $reportPdfUrl = null;

    #[ORM\Column(name: 'error_message', type: Types::TEXT, nullable: true)]
    private ?string $errorMessage = null;

    #[ORM\Column(name: 'analyzed_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $analyzedAt = null;

    public function getAnalysisId(): ?int
    {
        return $this->analysisId;
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

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function getMetricsData(): ?string
    {
        return $this->metricsData;
    }

    public function setMetricsData(?string $metricsData): self
    {
        $this->metricsData = $metricsData;
        return $this;
    }

    public function getReportPdfUrl(): ?string
    {
        return $this->reportPdfUrl;
    }

    public function setReportPdfUrl(?string $reportPdfUrl): self
    {
        $this->reportPdfUrl = $reportPdfUrl;
        return $this;
    }

    public function getErrorMessage(): ?string
    {
        return $this->errorMessage;
    }

    public function setErrorMessage(?string $errorMessage): self
    {
        $this->errorMessage = $errorMessage;
        return $this;
    }

    public function getAnalyzedAt(): ?\DateTimeInterface
    {
        return $this->analyzedAt;
    }

    public function setAnalyzedAt(?\DateTimeInterface $analyzedAt): self
    {
        $this->analyzedAt = $analyzedAt;
        return $this;
    }
}
