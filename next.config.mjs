/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Vidéos état des lieux Caution (mp4 smartphone)
      bodySizeLimit: "100mb",
    },
  },
  serverExternalPackages: [
    "pdfjs-dist",
    "@sparticuz/chromium-min",
    "puppeteer-core",
  ],
  async redirects() {
    return [
      {
        source: "/livret",
        destination: "/parametres",
        permanent: false,
      },
      {
        source: "/espace-maries",
        destination: "/parametres",
        permanent: false,
      },
    ];
  },
  webpack: (config, { dev }) => {
    // Réduit les corruptions de cache quand dev + build se chevauchent
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
