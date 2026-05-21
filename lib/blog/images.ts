const BLOG_IMAGE_BASE_PATH = "/BABROO_IMAGES/";
const BLOG_THUMB_IMAGE_BASE_PATH = "/BABROO_IMAGES/THUMB/";

function normalizeUrlPath(value: string): string {
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/{2,}/g, "/");
    return url.toString();
  } catch {
    return value.replace(/([^:])\/{2,}/g, "$1/");
  }
}

export function resolveBlogImageUrl(
  imageUrl: string | null | undefined,
  imageName: string | null | undefined,
  options: { thumbnail?: boolean } = {}
): string | null {
  const directUrl = String(imageUrl ?? "").trim();
  if (directUrl) {
    return normalizeUrlPath(directUrl);
  }

  const fileName = String(imageName ?? "").trim();
  if (!fileName) {
    return null;
  }

  const basePath = options.thumbnail ? BLOG_THUMB_IMAGE_BASE_PATH : BLOG_IMAGE_BASE_PATH;
  return normalizeUrlPath(`${basePath}${fileName}`);
}
