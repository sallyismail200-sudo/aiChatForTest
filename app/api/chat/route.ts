import { assistant, run, user } from "@openai/agents";
import type { AgentInputItem } from "@openai/agents";
import { after, NextResponse } from "next/server";
import { auth } from "@/actions/auth";
import { lunaAgent } from "@/lib/chat/agents/marketingAgent";
import { PrismaSession } from "@/data-access-layer/aiSession-dal";
import {
  CONTINUE_PROMPT,
  MAX_MESSAGE_LENGTH,
  type ChatStreamEvent,
} from "@/lib/chat/protocol";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { chatDictionary } from "@/app/[lang]/types/ui/dictionaryTypes/contactus";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TURNS = 5;
const MAX_BODY_BYTES = 16_000;

const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

async function getUserId() {
  const authSession = await auth();
  return authSession?.user?.userId ?? null;
}

function rejectBadRequest(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    return jsonError("Unsupported content type.", 415);
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return jsonError("Request too large.", 413);
  return null;
}

function itemText(item: AgentInputItem): string {
  const content = (item as { content?: unknown }).content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part &&
        typeof part === "object" &&
        typeof (part as { text?: unknown }).text === "string"
          ? (part as { text: string }).text
          : "",
      )
      .join("");
  }
  return "";
}

function toDisplayMessages(items: AgentInputItem[]) {
  const messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
  }[] = [];
  let mergeNext = false;

  items.forEach((item, i) => {
    const role = (item as { role?: string }).role;
    const text = itemText(item);
    if (!text || (role !== "user" && role !== "assistant")) return;

    if (role === "user" && text === CONTINUE_PROMPT) {
      mergeNext = true;
      return;
    }
    const last = messages[messages.length - 1];
    if (role === "assistant" && mergeNext && last?.role === "assistant") {
      last.content += text;
    } else {
      messages.push({ id: `history-${i}`, role, content: text });
    }
    mergeNext = false;
  });

  return messages;
}

export async function POST(request: Request) {
  const abortController = new AbortController();

  const abortFromRequest = () => {
    abortController.abort(request.signal.reason);
  };

  request.signal.addEventListener("abort", abortFromRequest, {
    once: true,
  });

  const contactDictionary: chatDictionary = await getDictionary("contactus");
  try {
    const userId = await getUserId();

    if (!userId) {
      return jsonError(contactDictionary.signInMessage, 401);
    }

    const rejected = rejectBadRequest(request);
    if (rejected) return rejected;

    const body = await request.json().catch(() => null);

    const isContinue = body?.action === "continue";

    const text = isContinue
      ? CONTINUE_PROMPT
      : typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!text || text.length > MAX_MESSAGE_LENGTH) {
      return jsonError(contactDictionary.emptyMessage, 400);
    }

    const store = new PrismaSession(userId);
    const history = await store.getItems();

    if (isContinue && history.length === 0) {
      return jsonError(contactDictionary.noContinueMessage, 400);
    }

    const result = await run(lunaAgent, [...history, user(text)], {
      stream: true,
      maxTurns: MAX_TURNS,
      signal: abortController.signal,
    });

    const textStream = result.toTextStream({
      compatibleWithNodeStreams: true,
    });

    const encoder = new TextEncoder();
    let reply = "";

    let finishStream!: () => void;

    const streamFinished = new Promise<void>((resolve) => {
      finishStream = resolve;
    });

    after(() => streamFinished);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: ChatStreamEvent) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            return true;
          } catch {
            return false;
          }
        };

        let failed = false;

        try {
          for await (const chunk of textStream) {
            const chunkText = String(chunk);

            reply += chunkText;

            if (!send({ type: "delta", text: chunkText })) {
              abortController.abort();
              break;
            }
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            failed = true;

            console.error(contactDictionary.streamMessage, error);

            send({
              type: "error",
              message: contactDictionary.unAvailableMessage,
            });
          }
        } finally {
          try {
            await result.completed;
          } catch (error) {
            if (!abortController.signal.aborted && !failed) {
              failed = true;

              console.error(contactDictionary.runFailedMessage, error);

              send({
                type: "error",
                message: contactDictionary.unAvailableMessage,
              });
            }
          }

          if (reply.trim()) {
            await store
              .addItems([user(text), assistant(reply)])
              .catch((error) => {
                console.error(contactDictionary.saveMessage, error);
              });
          }

          if (!failed && !abortController.signal.aborted) {
            send({ type: "done" });
          }

          request.signal.removeEventListener("abort", abortFromRequest);

          try {
            controller.close();
          } catch {}

          finishStream();
        }
      },

      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    request.signal.removeEventListener("abort", abortFromRequest);

    console.error(contactDictionary.requestMessage, error);

    return jsonError(contactDictionary.unAvailableMessage, 500);
  }
}

export async function GET() {
  const contactDictionary: chatDictionary = await getDictionary("contactus");
  try {
    const userId = await getUserId();
    if (!userId) return jsonError(contactDictionary.signInMessage, 401);

    const items = await new PrismaSession(userId).getItems(50);
    return NextResponse.json({ messages: toDisplayMessages(items) });
  } catch (error) {
    console.error(contactDictionary.historyMessage, error);
    return jsonError(contactDictionary.loadMessage, 500);
  }
}

export async function DELETE() {
  const contactDictionary: chatDictionary = await getDictionary("contactus");
  try {
    const userId = await getUserId();
    if (!userId) return jsonError(contactDictionary.signInMessage, 401);

    await new PrismaSession(userId).clearSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(contactDictionary.clearMessage, error);
    return jsonError(contactDictionary.clearMessage, 500);
  }
}
