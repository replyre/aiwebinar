/**
 * The organisation / website / person graph, lifted verbatim from the pre-Next page.
 *
 * ⚠️ THE `@id` VALUES ARE THE GRAPH'S JOINTS, not decoration — `publisher` and `worksFor`
 * are references to them. Changing an `@id` without changing every reference silently
 * breaks the links, and Google reports nothing: the entities simply stop being connected.
 *
 * Absolute URLs are required here (relative ones are not valid in JSON-LD), so the site
 * origin is threaded in rather than hard-coded — a preview deploy then describes itself.
 */
export function organizationJsonLd(siteUrl: string) {
  const url = siteUrl.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        "name": "Innovgeist Technologies Private Limited",
        "alternateName": "Innovgeist",
        "url": `${url}/`,
        "logo": `${url}/assets/img/innovgeist-logo@2x.png`,
        "image": `${url}/assets/img/og-image.png`,
        "description": "AI software, intelligent automation and education technology company. DPIIT recognized startup partnering with educational institutions on practical AI education.",
        "email": "support@innovgeist.com",
        "telephone": "+91-8127273162",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Lucknow",
          "addressRegion": "Uttar Pradesh",
          "addressCountry": "IN"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Partnerships",
          "email": "support@innovgeist.com",
          "telephone": "+91-8127273162",
          "availableLanguage": [
            "en",
            "hi"
          ]
        },
        "knowsAbout": [
          "Artificial Intelligence",
          "Intelligent Automation",
          "Education Technology",
          "AI Literacy",
          "Prompt Engineering"
        ],
        "founder": {
          "@type": "Person",
          "name": "Atul Kumar Verma",
          "jobTitle": "Director"
        }
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        "url": `${url}/`,
        "name": "Innovgeist AI Education Partnership",
        "publisher": {
          "@id": `${url}/#organization`
        },
        "inLanguage": "en"
      },
      {
        "@type": "Person",
        "@id": `${url}/#atul-kumar-verma`,
        "name": "Atul Kumar Verma",
        "jobTitle": "Director",
        "description": "AI Engineer and Automation Consultant with over three years of professional experience across artificial intelligence, software engineering and intelligent automation.",
        "image": `${url}/assets/img/atul-kumar-verma@2x.jpg`,
        "worksFor": {
          "@id": `${url}/#organization`
        }
      }
    ]
  } as const;
}
