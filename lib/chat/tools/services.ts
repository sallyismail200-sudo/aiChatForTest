import { getServicesCached } from "@/data-access-layer/services-dal";
import {
  INVALID_ID_RESULT,
  UNAVAILABLE_RESULT,
  isValidId,
} from "@/lib/chat/tools/shared";
import { tool } from "@openai/agents";
import { z } from "zod";

type ServiceSummary = {
  id: string;
  nameEN: string;
  nameAR: string;
  aimEN: string;
  aimAR: string;
  sections: { nameEN: string; nameAR: string }[];
};

type ServiceDetails = {
  id: string;
  nameEN: string;
  nameAR: string;
  aimEN: string;
  aimAR: string;
  sections: {
    nameEN: string;
    nameAR: string;
    descriptionEN: string;
    descriptionAR: string;
  }[];
  plans: {
    nameEN: string;
    nameAR: string;
    descriptionsEN: string;
    descriptionsAR: string;
  }[];
};

export const getServicesTool = tool({
  name: "get_services_info",
  description: `
    List the services provided by CelloGraphics, including the names
    of the sections inside each service.

    Use this tool when:
    - The user asks which services the company offers.
    - The user describes a service OR a section (like "logo" or "packaging")
      but doesn't know which service contains it.
    - You need a service ID before calling get_service_info.

    Each service includes a "sections" array with section names.
    If the user mentions a section name (not a service name), match it to
    the parent service using this list.

    Review the English and Arabic names, aims, and section names to find
    the service that best matches the user's intent.
    Always use the returned ID when calling get_service_info.
    Never invent a service ID. If results are ambiguous, ask the user to
    clarify rather than guessing.
  `,
  parameters: z.object({}),
  async execute() {
    try {
      const services: ServiceSummary[] = await getServicesCached([
        { prismaField: "id", outputField: "id" },
        { prismaField: "nameEN", outputField: "nameEN" },
        { prismaField: "nameAR", outputField: "nameAR" },
        { prismaField: "aimEN", outputField: "aimEN" },
        { prismaField: "aimAR", outputField: "aimAR" },
        {
          prismaField: "sections",
          outputField: "sections",
          nested: [
            { prismaField: "nameEN", outputField: "nameEN" },
            { prismaField: "nameAR", outputField: "nameAR" },
          ],
        },
      ]);

      if (!services?.length) {
        return {
          found: false,
          services: [],
          message:
            "No services were found. Ask the user to try again later or contact support.",
        };
      }

      return { found: true, services };
    } catch (error) {
      console.error("get_services_info failed", error);
      return UNAVAILABLE_RESULT;
    }
  },
});

export const getServiceDetailsTool = tool({
  name: "get_service_info",
  description: `
    Retrieve detailed information about one specific CelloGraphics service,
    including its sections and the plans offered under it.

    Use this tool when the user asks about:
    - A particular service or its purpose.
    - The sections available within a service.
    - The plans offered under a specific service.
    - Comparing plans within a single service by their descriptions.
    - The sections within a service, including each section's name and description.
    - Details about a specific section (find the parent service first).

    First identify the service with get_services_info and pass the exact
    ID returned for it.

    This tool returns plan names and descriptions but NOT plan prices.
    For prices, use get_plans_info or get_plan_info.

    Do not guess IDs or invent missing details. If the service cannot be
    found, explain that its information is unavailable.
  `,
  parameters: z.object({
    serviceId: z
      .string()
      .describe("The exact service ID returned by get_services_info"),
  }),
  async execute({ serviceId }) {
    if (!isValidId(serviceId)) return INVALID_ID_RESULT;

    try {
      const services: ServiceDetails[] = await getServicesCached(
        [
          { prismaField: "id", outputField: "id" },
          { prismaField: "nameEN", outputField: "nameEN" },
          { prismaField: "nameAR", outputField: "nameAR" },
          { prismaField: "aimEN", outputField: "aimEN" },
          { prismaField: "aimAR", outputField: "aimAR" },
          {
            prismaField: "sections",
            outputField: "sections",
            nested: [
              { prismaField: "nameEN", outputField: "nameEN" },
              { prismaField: "nameAR", outputField: "nameAR" },
              { prismaField: "descriptionEN", outputField: "descriptionEN" },
              { prismaField: "descriptionAR", outputField: "descriptionAR" },
            ],
          },
          {
            prismaField: "plans",
            outputField: "plans",
            nested: [
              { prismaField: "nameEN", outputField: "nameEN" },
              { prismaField: "nameAR", outputField: "nameAR" },
              { prismaField: "descriptionsEN", outputField: "descriptionsEN" },
              { prismaField: "descriptionsAR", outputField: "descriptionsAR" },
            ],
          },
        ],
        { id: serviceId },
      );

      const service = services?.find((item) => String(item.id) === serviceId);
      if (!service) {
        return {
          found: false,
          message:
            "The requested service was not found. Verify the ID with get_services_info.",
        };
      }

      return { found: true, service };
    } catch (error) {
      console.error("get_service_info failed", error);
      return UNAVAILABLE_RESULT;
    }
  },
});
