export const MAX_MESSAGE_LENGTH = 2000;

export const CONTINUE_PROMPT = "Please continue exactly where you stopped.";

export type ChatRequest = { message: string } | { action: "continue" };

export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };
