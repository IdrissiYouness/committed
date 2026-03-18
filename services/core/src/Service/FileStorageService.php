<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\Uuid;
use Psr\Log\LoggerInterface;

class FileStorageService
{
    private string $targetDirectory;
    private LoggerInterface $logger;

    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private const ALLOWED_EXTENSIONS = [
        'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx',
        'txt', 'md', 'csv', 'zip',
        'py', 'java', 'cpp', 'c', 'js', 'ts', 'html', 'css', 'json' // Coding files
    ];

    public function __construct(string $targetDirectory, LoggerInterface $logger)
    {
        $this->targetDirectory = $targetDirectory;
        $this->logger = $logger;
    }

    /**
     * Validates and uploads a file to a specific domain directory.
     *
     * @param UploadedFile $file
     * @param string $domain The domain subdirectory (e.g., 'announcements', 'submissions')
     * @return array Array containing file metadata (fileName, filePath, fileType, fileSize)
     * @throws \InvalidArgumentException If validation fails
     * @throws \RuntimeException If upload fails
     */
    public function uploadFile(UploadedFile $file, string $domain): array
    {
        $size = $file->getSize();
        $mimeType = $file->getClientMimeType();
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension() ?: pathinfo($originalName, PATHINFO_EXTENSION));

        if ($size > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('File size exceeds the 10MB limit.');
        }

        if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
            throw new \InvalidArgumentException(sprintf(
                'Invalid file extension "%s". Allowed extensions are: %s.',
                $extension,
                implode(', ', self::ALLOWED_EXTENSIONS)
            ));
        }
        $newFilename = Uuid::v4()->toRfc4122() . '.' . $extension;
        $domainDirectory = rtrim($this->targetDirectory, '/') . '/' . $domain;

        if (!is_dir($domainDirectory)) {
            if (!mkdir($domainDirectory, 0777, true) && !is_dir($domainDirectory)) {
                $this->logger->error('Failed to create directory: ' . $domainDirectory);
                throw new \RuntimeException('Failed to create directory for uploaded file.');
            }
        }

        try {
            $file->move($domainDirectory, $newFilename);
        } catch (FileException $e) {
            $this->logger->error('Failed to move uploaded file: ' . $e->getMessage());
            throw new \RuntimeException('Failed to save uploaded file to the filesystem.');
        }

        return [
            'fileName' => $originalName,
            'filePath' => $domain . '/' . $newFilename,
            'fileType' => $mimeType,
            'fileSize' => $size
        ];
    }

    /**
     * Safely deletes a file from the filesystem.
     *
     * @param string $relativePath The relative path of the file (e.g., 'announcements/uuid.pdf')
     * @return bool True if successful or file doesn't exist
     * @throws \RuntimeException If deletion fails
     */
    public function deleteFile(string $relativePath): bool
    {
        $fullPath = rtrim($this->targetDirectory, '/') . '/' . ltrim($relativePath, '/');

        if (file_exists($fullPath)) {
            if (!unlink($fullPath)) {
                $this->logger->error('Failed to delete file from filesystem: ' . $fullPath);
                throw new \RuntimeException('Failed to delete file from the filesystem. DB deletion aborted.');
            }
        }

        return true;
    }
}