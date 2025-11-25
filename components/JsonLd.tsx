// FILE: components/JsonLd.tsx
"use client";

export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CalmTinnitus",
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Medical",
    operatingSystem: "Web, iOS, Android",
    url: "https://calmtinnitus.com",
    description:
      "CalmTinnitus is an AI-guided tinnitus relief and neuromodulation web app. It helps users match their tinnitus pitch, generate therapy tones, and relax with masking sounds such as white noise, rain and ocean waves.",
    image: "https://calmtinnitus.com/CalmTinnitus-Logo.png",
    keywords: [
      "tinnitus",
      "tinnitus relief",
      "tinnitus therapy",
      "neuromodulation",
      "notch therapy",
      "coordinated reset",
      "tinnitus app",
      "sound therapy",
      "white noise",
      "ear ringing"
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    audience: {
      "@type": "MedicalAudience",
      audienceType: "Tinnitus Patients",
    },
    author: {
      "@type": "Organization",
      name: "CalmTinnitus",
    },
    publisher: {
      "@type": "Organization",
      name: "CalmTinnitus",
    },
    // When you have live store links, uncomment and fill:
    // sameAs: [
    //   "https://apps.apple.com/app/your-app-id",
    //   "https://play.google.com/store/apps/details?id=your.app.id"
    // ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
