import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://theworldtamilmatrimony.com';
const BRAND = 'The World Tamil Matrimony';
const DEFAULT_OG_IMAGE = `${SITE_URL}/android-chrome-512x512.png`;

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  /** JSON-LD structured data — pass as an object, will be stringified */
  structuredData?: object;
}

export function SEO({
  title,
  description,
  keywords,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  structuredData,
}: SEOProps) {
  const fullTitle = title.includes(BRAND) ? title : `${title} | ${BRAND}`;
  const fullUrl = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Canonical */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:locale" content="en_GB" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* JSON-LD structured data */}
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
}
