<?php

namespace App\Service;

use App\Entity\Assignment;

class SubmissionService
{
    public function determineStatus(Assignment $assignment, ?\DateTimeInterface $submissionTime = null): string
    {
        return $this->isPastDueDate($assignment, $submissionTime) ? 'late' : 'submitted';
    }

    public function isPastDueDate(Assignment $assignment, ?\DateTimeInterface $submissionTime = null): bool
    {
        $dueDate = $assignment->getDueDate();
        if (!$dueDate) {
            return false;
        }

        $at = $submissionTime ?? new \DateTimeImmutable();
        return $at > $dueDate;
    }

    public function isLateSubmissionAllowed(Assignment $assignment): bool
    {
        return (bool) $assignment->isAllowLateSubmission();
    }

    public function canAcceptSubmission(Assignment $assignment, ?\DateTimeInterface $submissionTime = null): bool
    {
        if (!$this->isPastDueDate($assignment, $submissionTime)) {
            return true;
        }

        return $this->isLateSubmissionAllowed($assignment);
    }
}
