import { useCallback, useState } from "react";

export type ChatMessage = {
  chatId: string;
  fromId: string;
  toId: string;
  role: "driver" | "passenger";
  text: string;
  sentAt: number;
  fromSelf: boolean;
};

export function useChat(myId: string, role: "driver" | "passenger") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleMessage = useCallback((msg: unknown) => {
    const m = msg as Record<string, unknown>;
    if (m["type"] === "chat_message") {
      const cm: ChatMessage = {
        chatId: m["chatId"] as string,
        fromId: m["fromId"] as string,
        toId:   m["toId"]   as string,
        role:   m["role"]   as "driver" | "passenger",
        text:   m["text"]   as string,
        sentAt: m["sentAt"] as number,
        fromSelf: m["fromId"] === myId,
      };
      setMessages((prev) => [...prev.slice(-49), cm]);
    }
  }, [myId]);

  // `send` is a channel.postMessage-compatible function
  const sendMessage = useCallback((
    send: ((msg: object) => void) | null,
    toId: string,
    text: string,
  ) => {
    if (!send || !text.trim()) return;
    const chatId = "chat-" + Math.random().toString(36).slice(2, 10);
    const msg: ChatMessage = {
      chatId, fromId: myId, toId, role,
      text: text.trim(), sentAt: Date.now(), fromSelf: true,
    };
    send({ type: "chat_message", ...msg });
    setMessages((prev) => [...prev.slice(-49), msg]);
  }, [myId, role]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, handleMessage, sendMessage, clearMessages };
}
