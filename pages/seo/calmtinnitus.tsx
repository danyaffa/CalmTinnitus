// FILE: /pages/seo/calmtinnitus.tsx

import Head from "next/head";
import Link from "next/link";

const APP_URL = "https://calmtinnitus.com";

export default function CalmTinnitusSeoPage() {
  const title =
    "CalmTinnitus – Sound Therapy App for Tinnitus Relief & Better Sleep";
  const description =
    "CalmTinnitus helps people with tinnitus reduce distress using personalised sound therapy, relaxation audio, and daily tracking – on web and mobile.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CalmTinnitus",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web, Android, iOS",
    url: APP_URL,
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Tinnitus tone and noise matching",
      "Custom masking soundscapes",
      "Relaxation and sleep-support audio",
      "Daily symptom and mood tracking",
      "Education on tinnitus management",
    ],
    creator: {
      "@type": "Organization",
      name: "CalmTinnitus",
      url: APP_URL,
    },
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="CalmTinnitus, tinnitus app, tinnitus sound therapy, tinnitus relief, tinnitus maskers, ringing in ears, sleep with tinnitus"
        />
        <link rel="canonical" href={`${APP_URL}/seo/calmtinnitus`} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="CalmTinnitus – Tinnitus Sound Therapy App" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${APP_URL}/seo/calmtinnitus`} />
        <meta property="og:site_name" content="CalmTinnitus" />
        <meta property="og:image" content={`${APP_URL}/calmtinnitus_logo.png`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CalmTinnitus – Tinnitus Sound Therapy App" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${APP_URL}/calmtinnitus_logo.png`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10 prose prose-slate">
        <h1>CalmTinnitus – Personalised Sound Therapy for Tinnitus</h1>

        <p>
          <strong>CalmTinnitus</strong> is a web and mobile tinnitus companion that
          helps you tune a masking sound to your tinnitus, build calming sound
          routines, and track how you feel over time.
        </p>

        <h2>What CalmTinnitus does</h2>
        <ul>
          <li>Guides you to match the pitch and loudness of your tinnitus.</li>
          <li>Builds custom masking and relaxation soundscapes.</li>
          <li>Includes sleep-friendly background sounds and noise.</li>
          <li>Tracks daily symptoms, sleep, and mood.</li>
          <li>Provides simple education on tinnitus self-management.</li>
        </ul>

        <h2>Who CalmTinnitus is for</h2>
        <p>
          CalmTinnitus is for people who live with{" "}
          <em>ringing, hissing, or buzzing in the ears</em> and want practical,
          non-invasive tools they can use every day alongside medical care.
        </p>

        <h2>How to start</h2>
        <ol>
          <li>Create a free account on the CalmTinnitus site.</li>
          <li>Run the sound-matching wizard to find your tinnitus tone.</li>
          <li>Save one or more masking and relaxation sound mixes.</li>
          <li>Use them during the day or at night and log how you feel.</li>
        </ol>

        <p>
          Ready to try it?{" "}
          <Link href="/">
            <a>Go to the CalmTinnitus homepage</a>
          </Link>
        </p>

        <h2>Important links</h2>
        <ul>
          <li>
            <Link href="/">
              <a>CalmTinnitus homepage</a>
            </Link>
          </li>
          <li>
            <Link href="/legal-disclaimer-terms">
              <a>Terms &amp; Disclaimer</a>
            </Link>
          </li>
          <li>
            <Link href="/privacy-policy">
              <a>Privacy Policy</a>
            </Link>
          </li>
          <li>
            <Link href="/app-store">
              <a>App download page</a>
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}
