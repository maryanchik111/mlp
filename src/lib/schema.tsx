import * as React from 'react';

export function JsonLd({ data }: { data: unknown }): React.ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'My Little Pony Store',
  url: 'https://mlp-store.com.ua',
  description: 'Online store for My Little Pony toys, figures, and collectibles',
  logo: 'https://mlp-store.com.ua/icon-192.svg',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'support@mlp-store.com.ua',
  },
  sameAs: [
    'https://instagram.com',
    'https://facebook.com',
  ],
};

export const productSchema = (product: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.image || product.images?.[0],
  price: product.price,
  priceCurrency: 'UAH',
  availability: 'https://schema.org/InStock',
});

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: item.name,
    item: item.url,
  })),
});
