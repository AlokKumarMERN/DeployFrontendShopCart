/**
 * Converts Google Drive sharing links to direct image URLs
 * Supports multiple Google Drive URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?export=view&id=FILE_ID
 */
export const getGoogleDriveImageUrl = (url) => {
  if (!url) return null;

  // If it's already in the correct format, return it
  if (url.includes('drive.google.com/uc?export=view&id=')) {
    return url;
  }

  // Extract file ID from various Google Drive URL formats
  let fileId = null;

  // Format: https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    fileId = fileMatch[1];
  }

  // Format: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    fileId = openMatch[1];
  }

  // If we found a file ID, convert to direct image URL
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // If no pattern matched, return original URL
  return url;
};

/**
 * Processes an array of image URLs
 */
export const processImageUrls = (images) => {
  if (!images || !Array.isArray(images)) return [];
  return images.map(img => getGoogleDriveImageUrl(img));
};

/**
 * Extracts Google Drive file ID from URL
 */
export const extractGoogleDriveFileId = (url) => {
  if (!url) return null;

  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];

  return null;
};
