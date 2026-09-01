import type { NextConfig } from "next";

const scriptPolicy =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
const isLocalHttpBuild = /^http:\/\/(127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/.test(
  process.env.NEXT_PUBLIC_SITE_URL ?? "",
);

function getSupabaseConnectSources() {
  const sources = ["https://*.supabase.co", "wss://*.supabase.co"];
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!configuredUrl) return sources;

  try {
    const url = new URL(configuredUrl);
    const isLocalSupabase =
      (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
      (url.protocol === "http:" || url.protocol === "https:");

    if (!isLocalSupabase) return sources;

    sources.push(url.origin, `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}`);
  } catch {
    // Environment validation reports malformed URLs with a more actionable error.
  }

  return sources;
}

const supabaseConnectSources = getSupabaseConnectSources().join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  scriptPolicy,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${supabaseConnectSources}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isLocalHttpBuild ? [] : ["upgrade-insecure-requests"]),
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  ...(isLocalHttpBuild
    ? []
    : [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ]),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
