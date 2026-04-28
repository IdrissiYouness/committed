<?php

namespace App\DTO;

/**
 * Immutable value object carrying pagination metadata.
 * Included in every paginated admin response.
 */
class PaginationMeta
{
    public function __construct(
        private int $page,
        private int $size,
        private int $totalElements,
        private int $totalPages,
        private bool $hasNext,
        private bool $hasPrev
    ) {}

    /**
     * Build from raw values — computes hasNext / hasPrev / totalPages automatically.
     */
    public static function create(int $page, int $size, int $totalElements): self
    {
        $totalPages = $size > 0 ? (int) ceil($totalElements / $size) : 0;

        return new self(
            page:          $page,
            size:          $size,
            totalElements: $totalElements,
            totalPages:    $totalPages,
            hasNext:       $page < $totalPages - 1,
            hasPrev:       $page > 0
        );
    }

    public function getPage(): int
    {
        return $this->page;
    }

    public function getSize(): int
    {
        return $this->size;
    }

    public function getTotalElements(): int
    {
        return $this->totalElements;
    }

    public function getTotalPages(): int
    {
        return $this->totalPages;
    }

    public function isHasNext(): bool
    {
        return $this->hasNext;
    }

    public function isHasPrev(): bool
    {
        return $this->hasPrev;
    }

    public function toArray(): array
    {
        return [
            'page'          => $this->page,
            'size'          => $this->size,
            'totalElements' => $this->totalElements,
            'totalPages'    => $this->totalPages,
            'hasNext'       => $this->hasNext,
            'hasPrev'       => $this->hasPrev,
        ];
    }
}