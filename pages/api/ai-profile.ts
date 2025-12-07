// FILE: /pages/api/ai-profile.ts

import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: "CalmTinnitus",
    alternateName: "Calm Tinnitus",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web, Android, iOS",
    url: "https://calmtinnitus.com/",
    description:
      "CalmTinnitus is a sound-therapy app that helps you reduce tinnitus distress using personalised masking sounds, relaxation audio, and progress tracking.",
    downloadUrl: "https://calmtinnitus.com/app-store",
    installUrl: "https://calmtinnitus.com/app-store",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description:
        "Free plan with personalised tinnitus sound-matching and daily sessions.",
    },
    featureList: [
      "Tinnitus sound-matching wizard",
      "Custom masking and relief soundscapes",
      "Guided relaxation and sleep sessions",
      "Daily log and progress tracking",
      "Works with headphones or speakers",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "52",
    },
    creator: {
      "@type": "Organization",
      name: "CalmTinnitus",
      url: "https://calmtinnitus.com/",
    },
    brand: {
      "@type": "Brand",
      name: "CalmTinnitus",
    },
    sameAs: [
      "https://calmtinnitus.com/",
      // Add socials when ready
    ],
  };

  res.setHeader("Content-Type", "application/ld+json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).json(jsonLd);
}
