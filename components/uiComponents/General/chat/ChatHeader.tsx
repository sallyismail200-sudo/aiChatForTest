import {
  chatDictionary,
  ChatMessageType,
} from "@/app/[lang]/types/ui/dictionaryTypes/contactus";
import { Trash2, X } from "lucide-react";
import React, { Dispatch, RefObject, SetStateAction } from "react";

const ChatHeader = ({
  isLoading,
  messages,
  setMessages,
  setCanContinue,
  setError,
  activeAssistantIdRef,
  setOpen,
  chatDict,
}: {
  isLoading: boolean;
  messages: ChatMessageType[];
  setMessages: Dispatch<SetStateAction<ChatMessageType[]>>;
  setCanContinue: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  activeAssistantIdRef: RefObject<string | null>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  chatDict: chatDictionary;
}) => {
  const clearChat = async () => {
    if (isLoading) return;
    try {
      const res = await fetch("/api/chat", { method: "DELETE" });
      if (!res.ok) throw new Error("clear failed");
      setMessages([]);
      setCanContinue(false);
      setError(null);
      activeAssistantIdRef.current = null;
    } catch {
      setError("Could not clear the chat. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-between bg-gradient-to-b from-(--color_10) to-(--color_11) px-5 py-4 text-(--color_1)">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color_1) text-sm font-bold text-(--color_11)">
          C
        </div>
        <div>
          <h1 className="text-sm leading-tight font-semibold">
            {chatDict.aiTitle}
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-(--color_4)">
            <span className="h-1.5 w-1.5 rounded-full bg-(--color_1)" />
            {chatDict.aiAssistent}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={clearChat}
          disabled={isLoading || messages.length === 0}
          aria-label="Clear chat"
          title="Clear chat"
          className="cursor-pointer rounded-full p-2 text-(--color_4) transition hover:bg-(--color_1)/10 hover:text-(--color_1) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color_1) disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Trash2 size={17} />
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="cursor-pointer rounded-full p-2 text-(--color_4) transition hover:bg-(--color_1)/10 hover:text-(--color_1) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color_1)"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
