// FILE: components/JsonLd.tsx
"use client";

export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CalmTinnitus",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    // ⚠️ UPDATE THIS: Once you have real ratings, update these numbers dynamically
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "125",
    },
    description: "AI-powered sound therapy for tinnitus relief and neuromodulation.",
    author: {
      "@type": "Organization",
      name: "CalmTinnitus",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
