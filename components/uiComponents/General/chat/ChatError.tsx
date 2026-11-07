import React from "react";

const ChatError = ({ error }: { error: string | null }) => {
  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-2 rounded-lg border border-(--color_3) bg-(--color_1) px-3 py-2 text-xs text-(--color_10)"
        >
          {error}
        </div>
      )}
    </>
  );
};

export default ChatError;
