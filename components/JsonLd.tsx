// FILE: components/JsonLd.tsx
"use client";

export default function JsonLd() {
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CalmTinnitus",
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Medical",
    operatingSystem: "Web, iOS, Android",
    url: "https://www.calmtinnitus.com",
    description:
      "CalmTinnitus is an AI-guided tinnitus relief and neuromodulation web app. It helps users match their tinnitus pitch, generate therapy tones, and relax with masking sounds such as white noise, rain and ocean waves. Includes 14-day free trial.",
    image: "https://www.calmtinnitus.com/CalmTinnitus-Logo.png",
    keywords: [
      "tinnitus",
      "tinnitus relief",
      "tinnitus therapy",
      "tinnitus treatment",
      "tinnitus cure",
      "ringing in ears",
      "stop ringing in ears",
      "neuromodulation",
      "notch therapy",
      "coordinated reset",
      "tinnitus app",
      "sound therapy",
      "white noise",
      "tinnitus masker",
      "tinnitus sound therapy",
      "tinnitus frequency match",
      "sleep support tinnitus",
      "tinnitus management",
      "hearing health app"
    ],
    offers: {
      "@type": "Offer",
      price: "19.80",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      description: "Monthly subscription with 14-day free trial",
    },
    audience: {
      "@type": "MedicalAudience",
      audienceType: "Tinnitus Patients",
    },
    author: {
      "@type": "Organization",
      name: "Leffler International Investments Pty Ltd",
      url: "https://www.calmtinnitus.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Leffler International Investments Pty Ltd",
      url: "https://www.calmtinnitus.com",
    },
    copyrightHolder: {
      "@type": "Organization",
      name: "Leffler International Investments Pty Ltd",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Does CalmTinnitus cure tinnitus?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. There is currently no guaranteed cure for tinnitus. CalmTinnitus is a sound-training tool that may help some people reduce how loud or intrusive their tinnitus feels and improve focus or sleep over time.",
        },
      },
      {
        "@type": "Question",
        name: "How does the 14-day free trial work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "When you register, you get full access to all CalmTinnitus features for 14 days with no payment required. After the trial, you can subscribe for $19.80/month via PayPal to continue using the app.",
        },
      },
      {
        "@type": "Question",
        name: "Is CalmTinnitus a medical device?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. CalmTinnitus is a self-guided wellness and sound-training tool for adults. It does not diagnose, treat, cure, or prevent any disease and is not a substitute for medical care.",
        },
      },
      {
        "@type": "Question",
        name: "How do I stop or delete my account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Go to Account Settings and use the 'Stop / Delete My Account' button. This permanently removes all your data, session history, and account from CalmTinnitus automatically.",
        },
      },
      {
        "@type": "Question",
        name: "What therapy modes does CalmTinnitus offer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CalmTinnitus offers three therapy modes: Relief (CR neuromodulation), Standard masking, and Sleep Support with softer sounds designed to help you fall asleep.",
        },
      },
    ],
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Leffler International Investments Pty Ltd",
    url: "https://www.calmtinnitus.com",
    logo: "https://www.calmtinnitus.com/CalmTinnitus-Logo.png",
    description: "Developer and publisher of CalmTinnitus, a tinnitus relief and neuromodulation application.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
    </>
  );
}
