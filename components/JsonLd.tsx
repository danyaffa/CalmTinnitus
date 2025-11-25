// FILE: components/JsonLd.tsx
"use client";

export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CalmTinnitus",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "CalmTinnitus is an AI-guided tinnitus relief and neuromodulation web app. It helps users match their tinnitus pitch, generate sound therapy, and relax with masking sounds such as white noise, rain, and ocean waves.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: "https://calmtinnitus.com",
    image: "https://calmtinnitus.com/CalmTinnitus-Logo.png",
    // ⚠️ When you have real app-store links, add them here:
    // sameAs: [
    //   "https://apps.apple.com/app/your-app-id",
    //   "https://play.google.com/store/apps/details?id=your.app.id"
    // ],
    author: {
      "@type": "Organization",
      name: "CalmTinnitus",
    },
    publisher: {
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
