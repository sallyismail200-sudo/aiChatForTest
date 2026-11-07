import { chatDictionary } from "@/app/[lang]/types/ui/dictionaryTypes/contactus";
import { RotateCw } from "lucide-react";
import React from "react";

const ChatContinue = ({
  showContinue,
  continueGeneration,
  chatDict,
}: {
  showContinue: boolean;
  continueGeneration: () => Promise<void>;
  chatDict: chatDictionary;
}) => {
  return (
    <>
      {showContinue && (
        <button
          type="button"
          onClick={continueGeneration}
          className="mx-auto mb-2 flex cursor-pointer items-center gap-1.5 rounded-full border border-(--color_3) bg-(--color_1) px-3.5 py-1.5 text-xs font-medium text-(--color_10) transition hover:border-(--color_11) hover:bg-(--color_11) hover:text-(--color_1) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color_11)"
        >
          <RotateCw size={13} />
          {chatDict.continue}
        </button>
      )}
    </>
  );
};

export default ChatContinue;
