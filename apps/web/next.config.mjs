/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nexo/shared'],
  // Desactiva el indicador flotante de Next.js dev (botón circular abajo a la derecha)
  // que solapa con el botón "Cerrar sesión" del sidebar.
  devIndicators: false,
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};
export default nextConfig;
