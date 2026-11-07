import {
  chatDictionary,
  ChatMessageType,
} from "@/app/[lang]/types/ui/dictionaryTypes/contactus";
import { MessageCircle } from "lucide-react";
import React from "react";

const ChatInit = ({
  messages,
  sendMessage,
  authRequired,
  chatDict,
}: {
  messages: ChatMessageType[];
  sendMessage: (text: string) => Promise<void>;
  authRequired: boolean;
  chatDict: chatDictionary;
}) => {
  return (
    <>
      {messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-(--color_11) text-(--color_1)">
            <MessageCircle size={26} />
          </div>
          <p className="text-base font-semibold text-(--color_9)">
            {chatDict.help}
          </p>
          <p className="mt-1 max-w-[240px] text-xs text-(--color_5)">
            {chatDict.ask}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {chatDict.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                disabled={authRequired}
                className="cursor-pointer rounded-full border border-(--color_3) bg-(--color_1) px-3 py-1.5 text-xs text-(--color_7) transition hover:border-(--color_11) hover:bg-(--color_11) hover:text-(--color_1) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color_11) disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatInit;
