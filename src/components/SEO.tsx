import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  twitterCard?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Hire Verified Developers in India | DeveloperConnect',
  description = 'DeveloperConnect helps businesses hire verified developers, freelancers, and remote talent across India using AI-powered matching.',
  keywords = 'Hire Developers India, Freelance Developers India, Remote Developers India, React Developers India, Node.js Developers India, Startup Developers India',
  canonical = 'https://www.developerconnect.in',
  ogType = 'website',
  ogImage = 'https://www.developerconnect.in/og-image.png',
  twitterCard = 'summary_large_image',
}) => {
  const siteTitle = title.includes('DeveloperConnect') ? title : `${title} | DeveloperConnect`;

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "DeveloperConnect",
          "url": "https://www.developerconnect.in",
          "logo": "https://www.developerconnect.in/logo.png",
          "description": "DeveloperConnect helps businesses hire verified developers and remote talent across India.",
          "sameAs": [
            "https://twitter.com/devconnect",
            "https://linkedin.com/company/devconnect"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
