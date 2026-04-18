import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import fileService from '../../services/fileService';

/**
 * AttachmentButton
 *
 * A consistent, accessible download button for any file attachment.
 * Handles loading state, error toasting, and calls fileService internally.
 *
 * Props:
 *   url        — full API path, e.g. /api/submissions/5/attachments/12
 *   fileName   — display name shown in the button + used as download filename
 *   fileSize   — optional size in bytes; shown as "xx KB" when provided
 *   className  — extra Tailwind classes for the outer button element
 */
export default function AttachmentButton({ url, fileName, fileSize, className = '' }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await fileService.download(url, { fileName });
    } catch (err) {
      toast.error(err?.message || 'Failed to download file.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDownloading}
      aria-label={`Download ${fileName || 'file'}`}
      className={[
        'group flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-white',
        'px-3 py-2.5 text-left text-sm transition-colors duration-150',
        'hover:border-primary-300 hover:bg-primary-50',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      ].join(' ')}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary-500" aria-hidden="true" />
      ) : (
        <FileText className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-primary-500 transition-colors" aria-hidden="true" />
      )}

      <span className="flex-1 truncate font-medium text-neutral-700 group-hover:text-primary-700 transition-colors">
        {fileName || 'Attached file'}
      </span>

      {fileSize != null && !isDownloading && (
        <span className="shrink-0 text-xs text-neutral-400">
          {fileSize >= 1_048_576
            ? `${(fileSize / 1_048_576).toFixed(1)} MB`
            : `${Math.max(1, Math.round(fileSize / 1024))} KB`}
        </span>
      )}

      {!isDownloading && (
        <Download
          className="h-3.5 w-3.5 shrink-0 text-neutral-300 group-hover:text-primary-500 transition-colors"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
