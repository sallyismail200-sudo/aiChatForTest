import { getPlansCached } from "@/data-access-layer/plans-dal";
import {
  INVALID_ID_RESULT,
  PRICE_CURRENCY,
  UNAVAILABLE_RESULT,
  isValidId,
} from "@/lib/chat/tools/shared";
import { tool } from "@openai/agents";
import { z } from "zod";

type PlanSummary = {
  id: string;
  nameEN: string;
  nameAR: string;
  descriptionsEN: string;
  descriptionsAR: string;
  price: number;
  service: { nameEN: string; nameAR: string };
};

type PlanDetails = {
  id: string;
  nameEN: string;
  nameAR: string;
  descriptionsEN: string;
  descriptionsAR: string;
  price: number;
  service: { nameEN: string; nameAR: string };
  offers: {
    percentageOffer: number;
    offerEndDate: string;
    isActive: boolean;
  }[];
  planFeatures: {
    limit: number | null;
    feature: { descriptionEN: string; descriptionAR: string };
  }[];
};

function resolveCurrentOffer(price: number, offers: PlanDetails["offers"]) {
  const now = new Date();
  const best = (offers ?? [])
    .filter((o) => o.isActive && new Date(o.offerEndDate) > now)
    .sort((a, b) => b.percentageOffer - a.percentageOffer)[0];

  if (!best) return null;
  return {
    percentageOff: best.percentageOffer,
    endsOn: best.offerEndDate,
    discountedPrice:
      Math.round(price * (1 - best.percentageOffer / 100) * 100) / 100,
  };
}

export const getPlansTool = tool({
  name: "get_plans_info",
  description: `
    List available plans with their name, description, base price, and parent service.

    Use this tool when:
    - The user asks which plans are available.
    - The user wants to compare plans by price or by service.
    - The user asks which plans belong to a specific service.
    - You need a plan ID before calling get_plan_info.

    Review the English and Arabic names and descriptions.
    Use the actual returned plan ID when calling get_plan_info.
    Never invent a plan ID. If several plans match, ask the user to clarify.

    Prices here are base prices. For a discounted price during an
    active offer, use get_plan_info.
  `,
  parameters: z.object({}),
  async execute() {
    try {
      const plans: PlanSummary[] = await getPlansCached([
        { prismaField: "id", outputField: "id" },
        { prismaField: "nameEN", outputField: "nameEN" },
        { prismaField: "nameAR", outputField: "nameAR" },
        { prismaField: "descriptionsEN", outputField: "descriptionsEN" },
        { prismaField: "descriptionsAR", outputField: "descriptionsAR" },
        { prismaField: "price", outputField: "price" },
        {
          prismaField: "service",
          outputField: "service",
          nested: [
            { prismaField: "nameEN", outputField: "nameEN" },
            { prismaField: "nameAR", outputField: "nameAR" },
          ],
        },
      ]);

      if (!plans?.length) {
        return {
          found: false,
          plans: [],
          message:
            "No plans were found. Ask the user to try again later or contact support.",
        };
      }

      return { found: true, currency: PRICE_CURRENCY, plans };
    } catch (error) {
      console.error("get_plans_info failed", error);
      return UNAVAILABLE_RESULT;
    }
  },
});

export const getPlanDetailsTool = tool({
  name: "get_plan_info",
  description: `
    Retrieve detailed information about one specific plan: price,
    current offer, and included features.

    First identify the plan with get_plans_info, then pass its exact
    returned ID as planId.

    Use this tool when the user asks about a particular plan's
    description, price, conditions, or inclusions.

    The result is already calculated:
    - "currentOffer" is null when there is no active offer. Otherwise it
      has percentageOff, endsOn, and discountedPrice. Quote discountedPrice
      exactly and never recalculate.
    - Each feature's "limit" is a number or "unlimited". Always mention it.

    Never guess IDs or invent missing details. If the plan cannot be
    found, explain that its information is unavailable.
  `,
  parameters: z.object({
    planId: z.string().describe("The exact plan ID returned by get_plans_info"),
  }),
  async execute({ planId }) {
    if (!isValidId(planId)) return INVALID_ID_RESULT;

    try {
      const plans: PlanDetails[] = await getPlansCached(
        [
          { prismaField: "id", outputField: "id" },
          {
            prismaField: "service",
            outputField: "service",
            nested: [
              { prismaField: "nameEN", outputField: "nameEN" },
              { prismaField: "nameAR", outputField: "nameAR" },
            ],
          },
          { prismaField: "nameEN", outputField: "nameEN" },
          { prismaField: "nameAR", outputField: "nameAR" },
          { prismaField: "descriptionsEN", outputField: "descriptionsEN" },
          { prismaField: "descriptionsAR", outputField: "descriptionsAR" },
          { prismaField: "price", outputField: "price" },
          {
            prismaField: "offers",
            outputField: "offers",
            nested: [
              {
                prismaField: "percentageOffer",
                outputField: "percentageOffer",
              },
              { prismaField: "offerEndDate", outputField: "offerEndDate" },
              { prismaField: "isActive", outputField: "isActive" },
            ],
          },
          {
            prismaField: "planFeatures",
            outputField: "planFeatures",
            nested: [
              { prismaField: "limit", outputField: "limit" },
              {
                prismaField: "feature",
                outputField: "feature",
                nested: [
                  {
                    prismaField: "descriptionEN",
                    outputField: "descriptionEN",
                  },
                  {
                    prismaField: "descriptionAR",
                    outputField: "descriptionAR",
                  },
                ],
              },
            ],
          },
        ],
        { id: planId },
      );

      const plan = plans?.find((item) => String(item.id) === planId);
      if (!plan) {
        return {
          found: false,
          message:
            "The requested plan was not found. Verify the ID with get_plans_info.",
        };
      }

      const { offers, planFeatures, ...rest } = plan;
      return {
        found: true,
        plan: {
          ...rest,
          currency: PRICE_CURRENCY,
          currentOffer: resolveCurrentOffer(plan.price, offers),
          features: (planFeatures ?? []).map((f) => ({
            ...f.feature,
            limit: f.limit ? f.limit : "unlimited", // 0 or null means unlimited
          })),
        },
      };
    } catch (error) {
      console.error("get_plan_info failed", error);
      return UNAVAILABLE_RESULT;
    }
  },
});
