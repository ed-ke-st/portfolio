import { headers } from "next/headers";

/**
 * Returns the correct path prefix for internal links.
 * On the platform domain (folio.skin): /{username}
 * On a custom domain (edkest.com):     "" — the username is already implied by the domain
 */
export async function getSiteBasePath(username: string): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-custom-domain") === "true" ? "" : `/${username}`;
}
