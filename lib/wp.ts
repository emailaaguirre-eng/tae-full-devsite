// Placeholder WP REST client
// TODO: implement authenticated fetch using WP_API_BASE and WP_APP_USER/PASS from env

export async function fetchArtKey(token: string) {
  // GET by token from WP REST (custom endpoint or query meta)
  return { token, data: null };
}

export async function saveArtKey(token: string, json: any, meta: { template?: string; design_url?: string; qr_url?: string; print_url?: string }) {
  // POST/PUT to WP REST to update meta fields
  return { ok: true };
}
