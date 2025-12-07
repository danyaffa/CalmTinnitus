// FILE: /pages/app-store.tsx

import Head from "next/head";
import Link from "next/link";

const APP_URL = "https://calmtinnitus.com";

// TODO: replace with real store URLs
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.calmtinnitus";
const APP_STORE_URL =
  "https://apps.apple.com/app/calmtinnitus/id1234567890";

export default function AppStoreLandingPage() {
  const title = "Download CalmTinnitus App – Android & iOS";
  const description =
    "Install the CalmTinnitus app on Android or iOS to access personalised tinnitus sound therapy, relaxation audio, and daily tracking on the go.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "CalmTinnitus",
    operatingSystem: "Android, iOS",
    applicationCategory: "HealthApplication",
    url: `${APP_URL}/app-store`,
    downloadUrl: PLAY_STORE_URL,
    installUrl: PLAY_STORE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
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
        <link rel="canonical" href={`${APP_URL}/app-store`} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${APP_URL}/app-store`} />
        <meta property="og:image" content={`${APP_URL}/calmtinnitus_logo.png`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${APP_URL}/calmtinnitus_logo.png`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-10 text-center">
        <h1 className="mb-4 text-3xl font-semibold">Download CalmTinnitus</h1>
        <p className="mb-8 text-slate-700">
          Install CalmTinnitus to keep your personalised tinnitus sound therapy
          and relaxation sessions with you wherever you go.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href={PLAY_STORE_URL}
            className="rounded-md border px-6 py-3 text-sm font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get it on Google Play
          </a>

          <a
            href={APP_STORE_URL}
            className="rounded-md border px-6 py-3 text-sm font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download on the App Store
          </a>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Prefer the web app?{" "}
          <Link href="/">
            <a>Open CalmTinnitus in your browser</a>
          </Link>
        </p>
      </main>
    </>
  );
}
