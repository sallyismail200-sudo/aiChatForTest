import { getOffersCached } from "@/data-access-layer/offers-dal";
import {
  INVALID_ID_RESULT,
  PRICE_CURRENCY,
  UNAVAILABLE_RESULT,
  isValidId,
  toPlainText,
} from "@/lib/chat/tools/shared";
import { tool } from "@openai/agents";
import { z } from "zod";

const EXPOSE_OFFER_CODES = false;

const EXPIRED_VISIBLE_DAYS = 90;

type OfferStatus = "active" | "expired";

type OfferSummary = {
  id: string;
  nameEN: string;
  nameAR: string;
  code: string;
  shortDetailsEN: string;
  shortDetailsAR: string;
  expiresAt: string | null;
  isActive: boolean;
};

type OfferDetails = {
  id: string;
  nameEN: string;
  nameAR: string;
  code: string;
  shortDetailsEN: string;
  shortDetailsAR: string;
  detailsEN: string;
  detailsAR: string;
  price: number;
  duration: number;
  extended: boolean;
  reActivate: boolean;
  expiresAt: string | null;
  createdAt: string;
  conditions: string;
  isActive: boolean;
};

function getExpiryTime(expiresAt: string | Date | null): number | null {
  if (!expiresAt) return null;

  const isDateOnly =
    typeof expiresAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(expiresAt);

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;

  if (isDateOnly) date.setUTCHours(23, 59, 59, 999);
  return date.getTime();
}

function getOfferStatus(offer: { expiresAt: string | null }): OfferStatus {
  const expiry = getExpiryTime(offer.expiresAt);
  if (expiry === null) return "active";
  return expiry > Date.now() ? "active" : "expired";
}

function isVisibleOffer(offer: {
  isActive: boolean;
  expiresAt: string | null;
}): boolean {
  if (!offer.isActive) return false;

  const expiry = getExpiryTime(offer.expiresAt);
  if (expiry === null) return true;

  const cutoff = Date.now() - EXPIRED_VISIBLE_DAYS * 24 * 60 * 60 * 1000;
  return expiry > cutoff;
}

function toPublicOffer<
  T extends {
    code: string;
    isActive: boolean;
    expiresAt: string | null;
    createdAt?: string;
  },
>(offer: T) {
  const { isActive, createdAt, code, ...rest } = offer;
  const withStatus = { ...rest, status: getOfferStatus(offer) };

  return EXPOSE_OFFER_CODES && withStatus.status === "active"
    ? { ...withStatus, code }
    : withStatus;
}

export const getOffersTool = tool({
  name: "get_offers_info",
  description: `
    List CelloGraphics offers, including recently expired ones.

    Use this tool when the user asks:
    - Which offers or promotions are available.
    - To find an offer by its name or purpose.
    - Whether a specific offer is still valid or has expired.
    - To identify the correct offer ID before retrieving its details.

    Each offer has a "status": "active" or "expired".
    Never present an expired offer as available.
    Review the Arabic and English names and short descriptions to find
    relevant offers.

    Use the actual returned ID when calling get_offer_info.
    Never invent offer IDs.

    If no matching offer is found, tell the user that no offer matches
    their request.
  `,
  parameters: z.object({}),
  async execute() {
    try {
      const allOffers: OfferSummary[] = await getOffersCached([
        { prismaField: "id", outputField: "id" },
        { prismaField: "nameEN", outputField: "nameEN" },
        { prismaField: "nameAR", outputField: "nameAR" },
        { prismaField: "code", outputField: "code" },
        { prismaField: "shortDetailsEN", outputField: "shortDetailsEN" },
        { prismaField: "shortDetailsAR", outputField: "shortDetailsAR" },
        { prismaField: "expiresAt", outputField: "expiresAt" },
        { prismaField: "isActive", outputField: "isActive" },
      ]);

      const offers = (allOffers ?? [])
        .filter(isVisibleOffer)
        .map(toPublicOffer)
        // active offers first
        .sort((a, b) =>
          a.status === b.status ? 0 : a.status === "active" ? -1 : 1,
        );

      if (offers.length === 0) {
        return {
          found: false,
          offers: [],
          message: "No offers exist.",
        };
      }

      return { found: true, offers: toPlainText(offers) };
    } catch (error) {
      console.error("get_offers_info failed", error);
      return UNAVAILABLE_RESULT;
    }
  },
});

export const getOfferDetailsTool = tool({
  name: "get_offer_info",
  description: `
    Retrieve detailed information about one specific CelloGraphics offer
    using its exact ID.

    Use this tool when the user asks about:
    - The details or terms of a particular offer.
    - Its price, duration, or expiration date.
    - Conditions or eligibility requirements.
    - Whether the offer can be reactivated or extended.
    - Whether the offer is still valid.

    First identify the offer with get_offers_info, then pass its exact
    returned ID as offerId.

    FIELD NOTES:
    - "status" is "active" or "expired".
    - "price" is the offer's own price (see "currency").
    - "duration" is the offer's duration in days.
    - "expiresAt" is the expiration date (null = no expiry).
    - "extended" means the offer's duration has been extended.
    - "reActivate" means the offer can be reactivated.
    - "conditions" are the eligibility requirements.

    If status is "expired", tell the user it ended on "expiresAt" and do
    not encourage them to claim it. If found is false, the offer does not
    exist. Never guess IDs, prices, conditions, or dates.
  `,
  parameters: z.object({
    offerId: z
      .string()
      .describe("The exact offer ID returned by get_offers_info"),
  }),
  async execute({ offerId }) {
    if (!isValidId(offerId)) return INVALID_ID_RESULT;

    try {
      const allOffers: OfferDetails[] = await getOffersCached(
        [
          { prismaField: "id", outputField: "id" },
          { prismaField: "nameEN", outputField: "nameEN" },
          { prismaField: "nameAR", outputField: "nameAR" },
          { prismaField: "code", outputField: "code" },
          { prismaField: "shortDetailsEN", outputField: "shortDetailsEN" },
          { prismaField: "shortDetailsAR", outputField: "shortDetailsAR" },
          { prismaField: "detailsEN", outputField: "detailsEN" },
          { prismaField: "detailsAR", outputField: "detailsAR" },
          { prismaField: "price", outputField: "price" },
          { prismaField: "duration", outputField: "duration" },
          { prismaField: "extended", outputField: "extended" },
          { prismaField: "reActivate", outputField: "reActivate" },
          { prismaField: "expiresAt", outputField: "expiresAt" },
          { prismaField: "createdAt", outputField: "createdAt" },
          { prismaField: "conditions", outputField: "conditions" },
          { prismaField: "isActive", outputField: "isActive" },
        ],
        { id: offerId },
      );

      const offer = allOffers?.find((o) => String(o.id) === offerId);

      if (!offer || !offer.isActive) {
        return { found: false, message: "The requested offer was not found." };
      }

      return {
        found: true,
        offer: toPlainText({
          ...toPublicOffer(offer),
          currency: PRICE_CURRENCY,
        }),
      };
    } catch (error) {
      console.error("get_offer_info failed", error);
      return UNAVAILABLE_RESULT;
    }
  },
});
