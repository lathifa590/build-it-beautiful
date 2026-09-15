import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { LandingPageTemplate } from './LandingPageTemplate';
import { SEOPagesData } from './SEOPagesData';

export default function SEOPage({ explicitSlug }: { explicitSlug?: string }) {
  // Can be used via direct prop (for static mapping in App.tsx) or via URL param
  const { slug: paramSlug } = useParams();
  const slug = explicitSlug || paramSlug;

  if (!slug || !SEOPagesData[slug]) {
    return <Navigate to="/" replace />;
  }

  const pageData = SEOPagesData[slug];

  return <LandingPageTemplate slug={`/${slug}`} {...pageData} />;
}
