export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mlpcutiefamily.pp.ua';

  const routes = [
    {
      url: '/',
      changefreq: 'weekly',
      priority: '1.0',
      lastmod: new Date().toISOString().split('T')[0],
    },
    {
      url: '/catalog',
      changefreq: 'daily',
      priority: '0.9',
      lastmod: new Date().toISOString().split('T')[0],
    },
    {
      url: '/box-builder',
      changefreq: 'weekly',
      priority: '0.9',
      lastmod: new Date().toISOString().split('T')[0],
    },
    {
      url: '/account',
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: new Date().toISOString().split('T')[0],
    },
    {
      url: '/checkout',
      changefreq: 'monthly',
      priority: '0.6',
      lastmod: new Date().toISOString().split('T')[0],
    },
    {
      url: '/payment',
      changefreq: 'monthly',
      priority: '0.6',
      lastmod: new Date().toISOString().split('T')[0],
    },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `
  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`
  )
  .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
    },
  });
}
