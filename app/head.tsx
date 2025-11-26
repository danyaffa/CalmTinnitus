export default function Head() {
  return (
    <>
      <title>CalmTinnitus – Tinnitus Relief Companion</title>

      {/* 🔗 Sitemap link for Google & SEO */}
      <link
        rel="sitemap"
        type="application/xml"
        href="/sitemap.xml"
      />

      {/* Standard SEO */}
      <meta
        name="description"
        content="CalmTinnitus – a daily sound-training tool designed to reduce tinnitus intrusiveness."
      />
      <meta name="robots" content="index, follow" />
    </>
  );
}
