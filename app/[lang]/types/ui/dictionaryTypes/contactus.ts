export type contactUsDictionary = {
  title: string;
  messagePlaceholder: string;
};
export type chatDictionary = {
  help: string;
  ask: string;
  signIn: string;
  aiExplain: string;
  aiTitle: string;
  aiAssistent: string;
  continue: string;
  suggestions: string[];
  unAvailableMessage: string;
  signInMessage: string;
  emptyMessage: string;
  noContinueMessage: string;
  streamMessage: string;
  saveMessage: string;
  requestMessage: string;
  historyMessage: string;
  loadMessage: string;
  clearMessage: string;
  runFailedMessage: string;
};
export type ChatMessageType = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
