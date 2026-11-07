import { ChatMessageType } from "@/app/[lang]/types/ui/dictionaryTypes/contactus";
import React from "react";

const ChatMessage = ({ msg }: { msg: ChatMessageType }) => {
  return (
    <div
      className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      {msg.role === "assistant" && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--color_11) text-xs font-bold text-(--color_1)">
          C
        </div>
      )}
      <div
        dir="auto"
        className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          msg.role === "user"
            ? "rounded-2xl rounded-br-md bg-gradient-to-b from-(--color_10) to-(--color_11) text-(--color_1)"
            : "rounded-2xl rounded-bl-md border border-(--color_2) bg-(--color_1) text-(--color_9) shadow-sm"
        }`}
      >
        {msg.content ||
          (msg.role === "assistant" && (
            <span
              className="flex items-center gap-1 py-1"
              aria-label="Thinking"
            >
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color_4)"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </span>
          ))}
      </div>
    </div>
  );
};

export default ChatMessage;
