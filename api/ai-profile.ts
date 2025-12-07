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
      "CalmTinnitus is a sound-therapy app that helps reduce tinnitus distress with personalised masking sounds, relaxation audio, and daily progress tracking.",
    downloadUrl: "https://calmtinnitus.com/app-store",
    installUrl: "https://calmtinnitus.com/app-store",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    featureList: [
      "Tinnitus sound-matching",
      "Custom masking soundscapes",
      "Relaxation and sleep audio",
      "Daily symptom tracking",
      "Works with headphones or speakers"
    ],
    creator: {
      "@type": "Organization",
      name: "CalmTinnitus"
    }
  };

  res.setHeader("Content-Type", "application/ld+json; charset=utf-8");
  res.status(200).json(jsonLd);
}
