// FILE: /app/app-store/page.tsx

import Head from "next/head";
import Link from "next/link";

const APP_URL = "https://calmtinnitus.com";

// Placeholder store links
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=app.placeholder.calmtinnitus";
const APP_STORE_URL =
  "https://apps.apple.com/app/id1000000002";

export default function AppStoreLandingPage() {
  const title = "Download CalmTinnitus – Android & iOS";
  const description =
    "Install the CalmTinnitus app on Android or iOS to access personalised tinnitus sound therapy and relaxation tools.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${APP_URL}/app-store`} />
      </Head>

      <main className="mx-auto max-w-xl text-center px-4 py-10">
        <h1 className="text-3xl font-semibold mb-4">Download CalmTinnitus</h1>
        <p className="text-slate-600 mb-8">
          Access sound therapy, relaxation, and tinnitus tracking on your phone.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row justify-center">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border px-6 py-3 rounded-md font-medium"
          >
            Get it on Google Play
          </a>

          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border px-6 py-3 rounded-md font-medium"
          >
            Download on the App Store
          </a>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Prefer the web version? <Link href="/">Open CalmTinnitus in your browser</Link>
        </p>
      </main>
    </>
  );
}
