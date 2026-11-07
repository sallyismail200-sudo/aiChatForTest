import { tool } from "@openai/agents";
import { z } from "zod";
import { websiteMainInfo, WebsiteSectionId } from "./websiteFeatures";

type Lang = "en" | "ar";

type HelpSection = {
  title: string;
  href?: string;
  features: readonly { id: string; description: string; href?: string }[];
};

const withLang = (href: string, lang: Lang) =>
  `/${lang}${href.startsWith("/") ? href : `/${href}`}`;

function formatSection(section: HelpSection, lang: Lang): string {
  const header = section.href
    ? `# ${section.title}\nURL: ${withLang(section.href, lang)}`
    : `# ${section.title}`;

  const features = section.features
    .map((f) => {
      const link = f.href ? `\nURL: ${withLang(f.href, lang)}` : "";
      return `### ${f.id}\n${f.description.trim()}${link}`;
    })
    .join("\n\n");

  return `${header}\n\n${features}`;
}

const SECTION_IDS = Object.keys(websiteMainInfo) as [
  WebsiteSectionId,
  ...WebsiteSectionId[],
];

export const getWebsiteFeatureHelpTool = tool({
  name: "get_website_feature_help",
  description: `
Returns documentation for ONE section of the website's user-facing features.

Use this tool when the visitor asks HOW TO USE the website itself, for example:
- how plans work (duration, renewal, allowances, slots, payment)
- how voting, comments, ratings, or opinions work
- how to send a project request, ask an expert, or contact the company
- how offers work (buying, status, notifications)
- how to access or edit the profile, share it, or view plans/offers/contributions
- how to find job openings on the Careers page

Do NOT use this tool for:
- what a service is or includes (use get_services_info / get_service_info)
- what a plan costs or includes (use get_plans_info / get_plan_info)
- current offers or current job openings (use get_offers_info / get_careers_jobs)

Always pass a section and the visitor's language. If you are not sure which
section applies, ask the visitor a clarifying question first.
Only share URLs that the tool returns. Never invent routes or functionality.
  `.trim(),
  parameters: z.object({
    section: z
      .enum(SECTION_IDS)
      .describe(
        "The website section to explain: plans, votesAndComments, messages, offers, profileInformation, careers.",
      ),
    language: z
      .enum(["en", "ar"])
      .describe("The language the visitor is writing in"),
  }),
  async execute({ section, language }) {
    const data = websiteMainInfo[section];
    if (!data) return `No documentation found for section: ${section}`;
    return formatSection(data, language);
  },
});
