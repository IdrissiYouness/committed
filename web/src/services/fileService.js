import api from './api';

/**
 * fileService
 *
 * Authenticated helper for protected file attachments.
 * Uses the shared API client so JWT/auth headers are included.
 */
const FALLBACK_MIME = 'application/octet-stream';

function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return 'download';
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'download';
}

function getFilenameFromDisposition(dispositionHeader) {
  if (!dispositionHeader || typeof dispositionHeader !== 'string') return null;

  // RFC 5987: filename*=UTF-8''encoded-name.ext
  const utf8Match = dispositionHeader.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  // filename="name.ext" OR filename=name.ext
  const simpleMatch = dispositionHeader.match(/filename\s*=\s*"?([^";]+)"?/i);
  return simpleMatch?.[1] || null;
}

function triggerBrowserDownload(blob, fileName = 'download') {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeFilename(fileName);
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after a delay — revoking synchronously races with the browser's
  // download initiation and can silently kill the transfer in some browsers.
  setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
}

async function fetchBlob(url, config = {}) {
  const response = await api.get(url, {
    responseType: 'blob',
    timeout: 0,       // no timeout for file downloads
    ...config,
  });

  const headers = response?.headers || {};
  const contentType = headers['content-type'] || FALLBACK_MIME;
  const disposition = headers['content-disposition'];

  // Guard: if the server returned an error wrapped in a blob (e.g. JSON 404 body
  // when the gateway couldn't find the file), surface it as a real error instead
  // of downloading a corrupted JSON file.
  if (contentType.includes('application/json')) {
    const text = await response.data.text();
    let message = 'File not found or server error.';
    try {
      const json = JSON.parse(text);
      message = json?.message || json?.error || message;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }

  const blob =
    response?.data instanceof Blob
      ? response.data
      : new Blob([response?.data], { type: contentType });

  const fileNameFromHeader = getFilenameFromDisposition(disposition);

  return { blob, fileNameFromHeader, contentType };
}

const fileService = {
  /**
   * Download a protected file using authenticated API client.
   *
   * @param {string} url - Protected file endpoint.
   * @param {object} [options]
   * @param {string} [options.fileName] - Preferred filename override.
   * @param {object} [options.config] - Extra request config.
   * @returns {Promise<{fileName: string, contentType: string}>}
   */
  download: async (url, { fileName, config } = {}) => {
    const { blob, fileNameFromHeader, contentType } = await fetchBlob(url, config);
    const finalName = sanitizeFilename(fileName || fileNameFromHeader || 'download');
    triggerBrowserDownload(blob, finalName);
    return { fileName: finalName, contentType };
  },

  /**
   * Open a protected file in a new tab (best for PDFs/images/text),
   * still fetched with auth headers.
   *
   * @param {string} url - Protected file endpoint.
   * @param {object} [options]
   * @param {object} [options.config] - Extra request config.
   * @returns {Promise<{objectUrl: string, contentType: string}>}
   */
  openInNewTab: async (url, { config } = {}) => {
    const { blob, contentType } = await fetchBlob(url, config);
    const objectUrl = window.URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    return { objectUrl, contentType };
  },

  /**
   * Fetch a protected file and return blob metadata for custom callers.
   *
   * @param {string} url
   * @param {object} [options]
   * @param {object} [options.config]
   * @returns {Promise<{blob: Blob, fileNameFromHeader: string | null, contentType: string}>}
   */
  getBlob: async (url, { config } = {}) => {
    return fetchBlob(url, config);
  },
};

export default fileService;
