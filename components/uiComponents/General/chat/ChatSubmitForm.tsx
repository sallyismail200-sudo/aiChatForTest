import { chatDictionary } from "@/app/[lang]/types/ui/dictionaryTypes/contactus";
import { useDirection } from "@/components/ui/direction";
import { MAX_MESSAGE_LENGTH } from "@/lib/chat/protocol";
import { ArrowUp, Square } from "lucide-react";
import React, { Dispatch, RefObject, SetStateAction } from "react";

const ChatSubmitForm = ({
  sendMessage,
  abortRef,
  input,
  inputRef,
  setInput,
  isLoading,
  chatDict,
}: {
  sendMessage: (text: string) => Promise<void>;
  abortRef: RefObject<AbortController | null>;
  input: string;
  inputRef: RefObject<HTMLInputElement | null>;
  setInput: Dispatch<SetStateAction<string>>;
  isLoading: boolean;
  chatDict: chatDictionary;
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const stopGeneration = () => abortRef.current?.abort();

  const direction = useDirection();

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-full border border-(--color_4) bg-(--color_1) py-1.5 ps-4 pe-1.5 transition focus-within:border-(--color_11) focus-within:bg-(--color_1)"
    >
      <input
        ref={inputRef}
        dir={direction}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={chatDict.ask}
        className="min-w-0 flex-1 bg-transparent text-sm text-(--color_9) placeholder:text-(--color_5) focus:outline-none disabled:opacity-50"
        disabled={isLoading}
      />

      {isLoading ? (
        <button
          type="button"
          onClick={stopGeneration}
          aria-label="Stop generating"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-(--color_11) text-(--color_1) transition hover:bg-(--color_7) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color_11) focus-visible:ring-offset-2"
        >
          <Square size={13} fill="currentColor" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-(--color_11) text-(--color_1) transition hover:bg-(--color_7) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color_11) focus-visible:ring-offset-2 disabled:bg-(--color_3)"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </form>
  );
};

export default ChatSubmitForm;
