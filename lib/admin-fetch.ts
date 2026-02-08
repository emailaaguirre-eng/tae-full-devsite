/**
 * Authenticated fetch wrapper for admin API calls.
 * Automatically adds the admin token as a Bearer Authorization header.
 *
 * Options:
 *   redirectOn401 (default: false) — if true, clears the token and
 *     redirects to the login page when the server returns 401.
 *     Set to true only for explicit user-initiated actions (e.g. form
 *     submissions) where a stale session should force re-login.
 *     Background/dashboard fetches should leave this false so a
 *     transient 401 (e.g. HMR token loss) doesn't kick the user out.
 */

import { getAdminToken, removeAdminToken } from './admin-auth';

interface AdminFetchOptions extends RequestInit {
  /** If true, auto-redirect to login on 401. Default: false. */
  redirectOn401?: boolean;
}

export async function adminFetch(
  url: string,
  options: AdminFetchOptions = {}
): Promise<Response> {
  const { redirectOn401 = false, ...fetchOptions } = options;

  const token = getAdminToken();

  const headers = new Headers(fetchOptions.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Only redirect on 401 when explicitly requested
  if (response.status === 401 && redirectOn401) {
    removeAdminToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/b_d_admn_tae/login';
    }
  }

  return response;
}
