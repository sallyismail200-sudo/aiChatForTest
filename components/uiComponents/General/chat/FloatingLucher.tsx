import { MessageCircle, X } from "lucide-react";
import React, { Dispatch, SetStateAction } from "react";

const FloatingLucher = ({
  setOpen,
  open,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
  open: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-label={open ? "Close chat" : "Open chat"}
      aria-expanded={open}
      className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-(--color_11) text-(--color_1) shadow-xl transition duration-200 hover:scale-105 hover:bg-(--color_10) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color_11) focus-visible:ring-offset-2 active:scale-95"
    >
      <MessageCircle
        size={26}
        className={`absolute transition-all duration-300 ${open ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
      />
      <X
        size={26}
        className={`absolute transition-all duration-300 ${open ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"}`}
      />
    </button>
  );
};

export default FloatingLucher;
