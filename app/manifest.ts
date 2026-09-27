import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RIADH CARD',
    short_name: 'RIADH',
    description: 'Ultra-premium digital loyalty CRM',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF7F2',
    theme_color: '#d4af37',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
