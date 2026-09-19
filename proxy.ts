import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * TEMPORARY under-construction gate: HTTP Basic Auth on every request.
 * To take the site public, delete this file (and the SITE_USER /
 * SITE_PASSWORD env vars). Nothing else in the app depends on it.
 *
 * (Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`.)
 */

const REALM = 'Basic realm="Rolls Ranch (under construction)", charset="UTF-8"';

function challenge(status: number, body: string) {
  return new NextResponse(body, {
    status,
    headers: { "WWW-Authenticate": REALM, "Cache-Control": "no-store" },
  });
}

/** Compares without bailing out at the first differing character. */
function safeEqual(a: string, b: string) {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function proxy(request: NextRequest) {
  const expectedUser = process.env.SITE_USER;
  const expectedPassword = process.env.SITE_PASSWORD;

  // Fail closed: if the gate is misconfigured, don't accidentally serve the site.
  if (!expectedUser || !expectedPassword) {
    return new NextResponse(
      "Site is locked, but SITE_USER / SITE_PASSWORD are not configured.",
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      // Decode as UTF-8 so non-ASCII passwords work.
      const decoded = new TextDecoder().decode(
        Uint8Array.from(atob(header.slice(6)), (c) => c.charCodeAt(0))
      );
      const separator = decoded.indexOf(":");
      if (separator !== -1) {
        const user = decoded.slice(0, separator);
        const password = decoded.slice(separator + 1);
        const userOk = safeEqual(user, expectedUser);
        const passwordOk = safeEqual(password, expectedPassword);
        if (userOk && passwordOk) return NextResponse.next();
      }
    } catch {
      // Malformed base64: fall through to the 401 challenge.
    }
  }

  return challenge(401, "Authentication required.");
}

// No matcher: applies to every route, including static files and images.
