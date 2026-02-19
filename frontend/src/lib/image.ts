/**
 * Utility functions for image URL transformations.
 * Supports Cloudinary URL transformations for optimized image loading.
 */

type ImageSize = "thumbnail" | "medium" | "large";

const SIZE_CONFIG: Record<ImageSize, { width: number; height?: number }> = {
  thumbnail: { width: 400, height: 400 },
  medium: { width: 800 },
  large: { width: 1200 },
};

/**
 * Transform a Cloudinary URL to include size optimizations.
 * For non-Cloudinary URLs, returns the original URL unchanged.
 */
export function getOptimizedImageUrl(
  url: string,
  size: ImageSize = "medium"
): string {
  if (!url) return url;

  // Check if this is a Cloudinary URL
  const cloudinaryMatch = url.match(
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)/
  );

  if (!cloudinaryMatch) {
    // Not a Cloudinary URL, return as-is
    return url;
  }

  const [, baseUrl, rest] = cloudinaryMatch;
  const config = SIZE_CONFIG[size];

  // Build transformation string
  let transform = `w_${config.width}`;
  if (config.height) {
    transform += `,h_${config.height},c_fill`;
  }
  transform += ",q_auto,f_auto";

  // Check if there are already transformations (look for v followed by numbers)
  const versionMatch = rest.match(/^(v\d+\/.*)/);
  if (versionMatch) {
    // No existing transforms, just version and path
    return `${baseUrl}${transform}/${rest}`;
  }

  // There might be existing transforms, insert ours at the start
  return `${baseUrl}${transform}/${rest}`;
}

/**
 * Get thumbnail URL for gallery cards (400x400, cropped)
 */
export function getThumbnailUrl(url: string): string {
  return getOptimizedImageUrl(url, "thumbnail");
}

/**
 * Get medium-sized URL for general display (800px wide)
 */
export function getMediumUrl(url: string): string {
  return getOptimizedImageUrl(url, "medium");
}

/**
 * Get large URL for lightbox/full view (1200px wide)
 */
export function getLargeUrl(url: string): string {
  return getOptimizedImageUrl(url, "large");
}

/**
 * Get a JPEG poster image from a Cloudinary video URL.
 * Cloudinary generates thumbnails by switching resource type and extension.
 * Uses `so_0` to snapshot the first frame.
 */
export function getVideoThumbnailUrl(url: string, width = 800): string {
  if (!url) return url;
  const match = url.match(
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.*)/
  );
  if (!match) return url;
  const [, baseUrl, rest] = match;
  const withoutExt = rest.replace(/\.[^.]+$/, "");
  const height = Math.round((width * 9) / 16);
  // Keep /video/upload/ — Cloudinary serves a JPEG thumbnail when the extension is .jpg
  return `${baseUrl}w_${width},h_${height},c_fill,q_auto,f_auto,so_0/${withoutExt}.jpg`;
}

/**
 * Get an optimized streaming URL for a Cloudinary video.
 * vc_auto selects the best codec per browser (WebM/H.265/H.264), q_auto adjusts quality.
 */
export function getOptimizedVideoUrl(url: string): string {
  if (!url) return url;
  const match = url.match(
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.*)/
  );
  if (!match) return url;
  const [, baseUrl, rest] = match;
  return `${baseUrl}vc_auto,q_auto/${rest}`;
}
