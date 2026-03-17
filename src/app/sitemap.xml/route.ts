import { ref, get } from 'firebase/database';
import { database, getForumThreads } from '@/lib/firebase';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mlpcutiefamily.pp.ua';

  const staticRoutes = [
    {
      url: '/',
      changefreq: 'weekly',
      priority: '1.0',
    },
    {
      url: '/catalog',
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      url: '/box-builder',
      changefreq: 'weekly',
      priority: '0.9',
    },
    {
      url: '/auctions',
      changefreq: 'daily',
      priority: '0.8',
    },
    {
      url: '/forum',
      changefreq: 'daily',
      priority: '0.8',
    },
    {
      url: '/account',
      changefreq: 'monthly',
      priority: '0.5',
    },
    {
      url: '/checkout',
      changefreq: 'monthly',
      priority: '0.4',
    },
    {
      url: '/payment',
      changefreq: 'monthly',
      priority: '0.4',
    },
    {
      url: '/delivery',
      changefreq: 'monthly',
      priority: '0.5',
    },
    {
      url: '/privacy',
      changefreq: 'monthly',
      priority: '0.3',
    },
    {
      url: '/refund',
      changefreq: 'monthly',
      priority: '0.3',
    },
    {
      url: '/terms',
      changefreq: 'monthly',
      priority: '0.3',
    },
  ];

  const routes = staticRoutes.map(route => ({
    ...route,
    lastmod: new Date().toISOString().split('T')[0],
  }));

  try {
    // Додаємо динамічні маршрути товарів
    const productsRef = ref(database, 'products');
    const productsSnapshot = await get(productsRef);
    if (productsSnapshot.exists()) {
      const productsData = productsSnapshot.val();
      const products = Array.isArray(productsData) ? productsData : Object.values(productsData);
      products.forEach((p: any) => {
        if (p && p.id) {
          routes.push({
            url: `/catalog/product/${p.id}`,
            changefreq: 'weekly',
            priority: '0.7',
            lastmod: new Date(p.updatedAt || Date.now()).toISOString().split('T')[0],
          });
        }
      });
    }

    // Додаємо динамічні маршрути форуму
    const threads = await getForumThreads();
    threads.forEach((t) => {
      if (t && t.id) {
        routes.push({
          url: `/forum/${t.id}`,
          changefreq: 'daily',
          priority: '0.6',
          lastmod: new Date(t.updatedAt || Date.now()).toISOString().split('T')[0],
        });
      }
    });
  } catch (error) {
    console.error('Error generating dynamic sitemap routes:', error);
  }

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
  </url>`
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
