// Central API base URL — reads from Vite environment variables.
// In development: .env.development  →  http://localhost:8080
// In production:  .env.production   →  your deployed backend URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ── Session guard ────────────────────────────────────────────────────────────
// A 401 from this backend does not always mean "the token aged out". A password
// reset, a ban, or an admin changing a user's email revokes every token issued
// before that moment, and the body reads "Session expired. Please login again."
// Retrying such a request can never succeed, so the only correct response is to
// drop the stored credentials and send the user to login with the server's own
// message.
//
// Authenticated calls are made from ~19 places with no shared client, so the
// check is installed once around fetch instead of repeated at every call site.

const SESSION_ENDED_EVENT = 'cpgeeks:session-ended';

export function installSessionGuard() {
  if (window.__cpgeeksSessionGuard) return;
  window.__cpgeeksSessionGuard = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const response = await nativeFetch(input, init);
    if (response.status !== 401) return response;

    const url = typeof input === 'string' ? input : (input?.url ?? '');
    // Our API only — and never the auth endpoints, where a wrong password is
    // also a 401 and the screen shows that message itself.
    if (!url.startsWith(API_URL) || url.includes('/api/auth/')) return response;

    // With no token stored the user simply is not logged in; the server's
    // "Missing authorization header" is not something to show them.
    const hadToken = Boolean(localStorage.getItem('token'));
    let message = hadToken
      ? 'Session expired. Please login again.'
      : 'Please log in to continue.';
    if (hadToken) {
      try {
        // Clone so the caller still gets an unread body.
        const body = await response.clone().json();
        if (body?.error) message = body.error;
      } catch {
        // Non-JSON body — keep the default message.
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT, { detail: { message } }));
    return response;
  };
}

// Subscribe to session loss. Returns an unsubscribe function.
export function onSessionEnded(handler) {
  const listener = (e) => handler(e.detail?.message);
  window.addEventListener(SESSION_ENDED_EVENT, listener);
  return () => window.removeEventListener(SESSION_ENDED_EVENT, listener);
}

// ── Dates ────────────────────────────────────────────────────────────────────
// The API accepts `YYYY-MM-DDTHH:MM:SS` (also without seconds, space separated,
// or RFC 3339 with an offset) and `""` to clear. Anything else is now a 400
// instead of being silently stored as null — notably the milliseconds a JS
// Date emits via toISOString().

// Builds the API format from a date input and an optional time input.
export function toApiDate(date, time) {
  if (!date) return '';
  return `${date}T${time ? `${time}:00` : '00:00:00'}`;
}

// Parses a timestamp coming back from the API. They are naive UTC with no
// suffix, so handing them straight to Date() reads them as local time — six
// hours off here. Returns null for missing or unparseable values.
export function parseApiDate(value) {
  if (!value) return null;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(String(value));
  const d = new Date(hasZone ? value : `${value}Z`);
  return isNaN(d.getTime()) ? null : d;
}

// Makes a value that came back from the API safe to send out again.
export function normalizeApiDate(value) {
  if (!value) return '';
  return String(value).replace(/\.\d+(?=Z?$)/, '');
}
