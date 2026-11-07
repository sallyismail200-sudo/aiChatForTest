"use client";

import { useEffect, useRef, useState } from "react";
import { type ChatRequest, type ChatStreamEvent } from "@/lib/chat/protocol";
import ChatHeader from "@/components/uiComponents/General/chat/ChatHeader";
import ChatInit from "@/components/uiComponents/General/chat/ChatInit";
import ChatMessage from "@/components/uiComponents/General/chat/ChatMessage";
import ChatError from "@/components/uiComponents/General/chat/ChatError";
import ChatContinue from "@/components/uiComponents/General/chat/ChatContinue";
import ChatSubmitForm from "@/components/uiComponents/General/chat/ChatSubmitForm";
import FloatingLucher from "@/components/uiComponents/General/chat/FloatingLucher";
import {
  chatDictionary,
  ChatMessageType,
} from "@/app/[lang]/types/ui/dictionaryTypes/contactus";

class ChatRequestError extends Error {}

export default function ChatWrapper({
  chatDict,
}: {
  chatDict: chatDictionary;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const activeAssistantIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || historyLoaded) return;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/chat", { signal: controller.signal });
        if (res.status === 401) {
          setAuthRequired(true);
          setHistoryLoaded(true);
          return;
        }
        if (!res.ok) throw new Error("history failed");
        const data = (await res.json()) as { messages: ChatMessageType[] };
        setMessages((prev) => (prev.length ? prev : data.messages));
        setHistoryLoaded(true);
      } catch {
        if (!controller.signal.aborted) setHistoryLoaded(true);
      }
    })();

    return () => controller.abort();
  }, [open, historyLoaded]);

  useEffect(() => {
    if (open && !isLoading) inputRef.current?.focus();
  }, [open, isLoading]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const appendText = (id: string, text: string) =>
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + text } : m)),
    );

  const streamReply = async (payload: ChatRequest, assistantId: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    activeAssistantIdRef.current = assistantId;

    setIsLoading(true);
    setError(null);
    setCanContinue(false);

    const isContinue = "action" in payload;
    let gotText = false;
    let sawDone = false;
    let sawError = false;
    let interrupted = false;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        if (res.status === 401) setAuthRequired(true);
        throw new ChatRequestError(
          data?.error ?? "Something went wrong. Please try again.",
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as ChatStreamEvent;

          if (event.type === "delta") {
            gotText = true;
            appendText(assistantId, event.text);
          } else if (event.type === "error") {
            sawError = true;
            setError(event.message);
          } else if (event.type === "done") {
            sawDone = true;
          }
        }
      }

      if (!sawDone) {
        interrupted = true;
        if (!sawError && !controller.signal.aborted) {
          setError("The connection was lost. Please try again.");
        }
      }
    } catch (err) {
      interrupted = true;
      if (!controller.signal.aborted) {
        setError(
          err instanceof ChatRequestError
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }
    } finally {
      abortRef.current = null;
      setIsLoading(false);
      if (!gotText) {
        setMessages((prev) =>
          prev.filter((m) => !(m.id === assistantId && m.content === "")),
        );
      }
      setCanContinue(interrupted && (gotText || isContinue));
    }
  };

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message || isLoading || authRequired) return;

    setInput("");
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: message },
      { id: assistantId, role: "assistant", content: "" },
    ]);

    await streamReply({ message }, assistantId);
  };

  const continueGeneration = async () => {
    const assistantId = activeAssistantIdRef.current;
    if (!assistantId || isLoading) return;
    await streamReply({ action: "continue" }, assistantId);
  };

  const showContinue = !isLoading && canContinue;

  return (
    <>
      <div
        role="dialog"
        aria-label="Cello Graphics chat"
        inert={!open}
        className={`fixed inset-x-3 bottom-24 z-50 flex h-[min(600px,calc(100dvh-7.5rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl bg-(--color_1) shadow-2xl transition-all duration-300 ease-out sm:inset-x-auto sm:right-6 sm:w-[380px] ${open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0"}`}
      >
        <ChatHeader
          activeAssistantIdRef={activeAssistantIdRef}
          isLoading={isLoading}
          messages={messages}
          setCanContinue={setCanContinue}
          setError={setError}
          setMessages={setMessages}
          setOpen={setOpen}
          chatDict={chatDict}
        />

        <div
          role="log"
          aria-live="polite"
          aria-busy={isLoading}
          className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-(--color_1) to-(--color_2) px-4 py-5"
        >
          <ChatInit
            authRequired={authRequired}
            messages={messages}
            sendMessage={sendMessage}
            chatDict={chatDict}
          />

          {messages.map((msg) => (
            <ChatMessage msg={msg} key={msg.id} />
          ))}
        </div>

        <div className="border-t border-(--color_2) bg-(--color_1) p-3">
          <ChatError error={error} />

          <ChatContinue
            continueGeneration={continueGeneration}
            showContinue={showContinue}
            chatDict={chatDict}
          />
          {authRequired ? (
            <p className="rounded-lg border border-(--color_2) bg-(--color_1) px-3 py-2 text-center text-xs text-(--color_10)">
              {chatDict.signIn}
            </p>
          ) : (
            <ChatSubmitForm
              abortRef={abortRef}
              input={input}
              inputRef={inputRef}
              isLoading={isLoading}
              sendMessage={sendMessage}
              setInput={setInput}
              chatDict={chatDict}
            />
          )}

          <p className="mt-2 text-center text-[10px] text-(--color_6)">
            {chatDict.aiExplain}
          </p>
        </div>
      </div>

      <FloatingLucher open={open} setOpen={setOpen} />
    </>
  );
}
