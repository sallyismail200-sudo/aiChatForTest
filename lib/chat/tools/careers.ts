import { getCMSPageCached } from "@/data-access-layer/cms-dal";
import { getSectionForPages } from "@/app/[lang]/types/ui/cmsTypes";
import { UNAVAILABLE_RESULT, toPlainText } from "@/lib/chat/tools/shared";
import { tool } from "@openai/agents";
import { z } from "zod";

type CareersPage = {
  slug: string;
  sections: getSectionForPages[];
};

const JOB_SECTION_SLUGS = ["jobs", "job-openings", "openings"];

export const getCareersInfoTool = tool({
  name: "get_careers_info",
  description: `
    Retrieves the CMS content for the Cello Graphics careers page,
    EXCLUDING the jobs section.

    Use this tool to answer questions about:
    - Company values and work culture.
    - Employee benefits and reasons to work at Cello Graphics.
    - The recruitment and hiring process.
    - General careers information and how to apply.

    This tool is NOT for current job openings. Use get_careers_jobs for those.
  `,
  parameters: z.object({}),
  async execute() {
    try {
      const pages: CareersPage[] = await getCMSPageCached(
        [
          { prismaField: "slug", outputField: "slug" },
          {
            prismaField: "sections",
            outputField: "sections",
            nested: [
              { prismaField: "slug", outputField: "slug" },
              { prismaField: "titleEN", outputField: "titleEN" },
              { prismaField: "titleAR", outputField: "titleAR" },
              { prismaField: "descriptionEN", outputField: "descriptionEN" },
              { prismaField: "descriptionAR", outputField: "descriptionAR" },
              { prismaField: "cards", outputField: "cards" },
            ],
          },
        ],
        { slug: "careers" },
      );

      const page = pages?.find((p) => p.slug === "careers");
      if (!page) {
        return { found: false, message: "Careers page content was not found." };
      }

      const generalSections = (page.sections ?? []).filter(
        (s) => !JOB_SECTION_SLUGS.includes(s.slug),
      );

      return {
        found: true,
        sections: toPlainText(generalSections),
        message:
          generalSections.length === 0
            ? "No general careers information is currently listed."
            : undefined,
      };
    } catch (error) {
      console.error("get_careers_info failed", error);
      return UNAVAILABLE_RESULT;
    }
  },
});

export const getCareersJobsTool = tool({
  name: "get_careers_jobs",
  description: `
    Retrieves the job cards currently stored in the Cello Graphics
    careers page CMS.

    Use this tool whenever the user asks about:
    - Available or open positions.
    - Job titles, responsibilities, or role requirements.
    - Applying for a particular role.

    Return only jobs actually present in the CMS. Never invent job titles
    or claim a position is open if the CMS does not list it.

    If no jobs are returned, tell the user that no openings are currently
    listed and suggest checking back later.
  `,
  parameters: z.object({}),
  async execute() {
    try {
      const pages: CareersPage[] = await getCMSPageCached(
        [
          { prismaField: "slug", outputField: "slug" },
          {
            prismaField: "sections",
            outputField: "sections",
            nested: [
              { prismaField: "slug", outputField: "slug" },
              { prismaField: "titleEN", outputField: "titleEN" },
              { prismaField: "titleAR", outputField: "titleAR" },
              { prismaField: "descriptionEN", outputField: "descriptionEN" },
              { prismaField: "descriptionAR", outputField: "descriptionAR" },
              { prismaField: "cards", outputField: "cards" },
              { prismaField: "attributes", outputField: "attributes" },
            ],
          },
        ],
        { slug: "careers" },
      );

      const page = pages?.find((p) => p.slug === "careers");
      if (!page) {
        return {
          found: false,
          jobs: [],
          message: "Careers page content was not found.",
        };
      }

      const jobsSection = (page.sections ?? []).find((s) =>
        JOB_SECTION_SLUGS.includes(s.slug),
      );
      if (!jobsSection) {
        return {
          found: false,
          jobs: [],
          message: "The careers jobs section was not found.",
        };
      }

      const cards = jobsSection.cards ?? [];
      if (cards.length === 0) {
        return {
          found: true,
          jobs: [],
          count: 0,
          message: "No job openings are currently listed.",
        };
      }

      return { found: true, jobs: toPlainText(cards), count: cards.length };
    } catch (error) {
      console.error("get_careers_jobs failed", error);
      return UNAVAILABLE_RESULT;
    }
  },
});
