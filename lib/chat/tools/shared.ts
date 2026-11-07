export const OBJECT_ID = /^[a-f0-9]{24}$/i;

// TODO: set your real currency. Prices are plain numbers in your database,
// so without this Luna has to guess what currency they are in.
export const PRICE_CURRENCY = "USD";

export const isValidId = (id: string) => OBJECT_ID.test(id);

export const INVALID_ID_RESULT = {
  found: false,
  message: "That ID is not valid. Get the exact ID from the list tool first.",
} as const;

export const UNAVAILABLE_RESULT = {
  found: false,
  message:
    "This information is temporarily unavailable. Suggest the visitor tries again shortly.",
} as const;

function stripHtmlString(text: string) {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// Walks any value and turns every string into plain text (no HTML tags).
export function toPlainText<T>(value: T): T {
  if (typeof value === "string") return stripHtmlString(value) as T;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((v) => toPlainText(v)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, toPlainText(v)]),
    ) as T;
  }
  return value;
}
