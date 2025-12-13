import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/success', '/cancel', '/video/', '/test-video'],
      },
    ],
    sitemap: 'https://santagram.app/sitemap.xml',
  };
}





