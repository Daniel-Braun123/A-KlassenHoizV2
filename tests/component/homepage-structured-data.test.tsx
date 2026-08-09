import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomepageStructuredData } from "@/components/seo/homepage-structured-data";
import { homepageFaqs } from "@/lib/seo/homepage-content";

describe("homepage structured data", () => {
  it("describes only the visible free web application and FAQ content", () => {
    const { container } = render(<HomepageStructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.textContent).toBeTruthy();

    const data = JSON.parse(script!.textContent!) as {
      "@context": string;
      "@graph": Array<Record<string, unknown>>;
    };

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@graph"].map((item) => item["@type"])).toEqual([
      "WebSite",
      "WebApplication",
      "FAQPage",
    ]);

    const application = data["@graph"][1];
    expect(application).toMatchObject({
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    });

    const faqPage = data["@graph"][2] as { mainEntity: unknown[] };
    expect(faqPage.mainEntity).toHaveLength(homepageFaqs.length);
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|reviewCount|award/i);
  });
});
