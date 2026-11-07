import { getDictionary } from "@/app/[lang]/dictionaries";
import ChatWrapper from "@/components/uiComponents/General/chat/ChatWrapper";

export default async function ChatPage() {
  const contactDictionary = await getDictionary("contactus");

  return <ChatWrapper chatDict={contactDictionary} />;
}
