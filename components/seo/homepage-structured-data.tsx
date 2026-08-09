import { absoluteUrl, siteConfig } from "@/lib/config/site";
import { homepageFaqs } from "@/lib/seo/homepage-content";

export function HomepageStructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        name: siteConfig.name,
        url: absoluteUrl("/"),
        description: siteConfig.description,
        inLanguage: siteConfig.language,
      },
      {
        "@type": "WebApplication",
        "@id": absoluteUrl("/#webapp"),
        name: siteConfig.name,
        url: absoluteUrl("/"),
        description: siteConfig.description,
        applicationCategory: "GameApplication",
        operatingSystem: "Web",
        inLanguage: siteConfig.language,
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
      },
      {
        "@type": "FAQPage",
        "@id": absoluteUrl("/#faq"),
        mainEntity: homepageFaqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }}
      type="application/ld+json"
    />
  );
}
