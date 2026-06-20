/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
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
