import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node-ical breaks when bundled; load it straight from node_modules.
  serverExternalPackages: ["node-ical"],
  images: {
    // Only needed for the local placeholder SVGs in /public/gallery.
    // Safe to remove once those are swapped for real JPG/PNG photos.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
