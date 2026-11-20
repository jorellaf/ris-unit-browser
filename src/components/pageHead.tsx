import React, { ReactNode } from 'react';
import { useSiteMetadata } from '../hooks/useSiteMetadata';

type SEOProps = {
  title: string;
  description?: string;
  pathname?: string;
  children?: ReactNode;
};

export const PageHead: React.FC<SEOProps> = ({
  title,
  description,
  pathname,
  children,
}) => {
  const {
    title: defaultTitle,
    description: defaultDescription,
    siteAuthor: defaultSiteAuthor,
    modAuthors: defaultModAuthors,
    siteUrl: baseSiteUrl,
  } = useSiteMetadata();

  const seo = {
    title: `${title.trim()} | ${defaultTitle}`,
    description: description || defaultDescription,
    author: `${defaultSiteAuthor} and ${defaultModAuthors}`,
    siteUrl: `${baseSiteUrl}${pathname || '/'}`,
  };

  return (
    <>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={seo.siteUrl} />
      <meta property="og:image" content={`${baseSiteUrl}/images/mod-banner.png`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={seo.author} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content="/images/mod-banner.png" />
      {children}
    </>
  );
};
