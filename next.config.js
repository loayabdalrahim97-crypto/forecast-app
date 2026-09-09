/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Locale routing is handled via the [locale] segment under src/app
  // rather than Next's built-in i18n config, so custom logic in
  // src/lib/i18n/config.ts (account preference > browser > fallback)
  // fully controls resolution (see §3).
};

module.exports = nextConfig;
