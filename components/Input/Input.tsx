"use client";

import { SendHorizontal, Plus, StopCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Message } from "../ChatMessages/ChatMessages";

const Input = ({
  setMessages,
  chatId,
  createNewChat,
  onMessageSent,
}: {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatId: string | null;
  createNewChat: () => Promise<string | null>;
  onMessageSent?: () => void;
}) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ✅ Auto resize textarea like ChatGPT
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 180) + "px";
  }, [text]);

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleSend = async () => {
    if (loading) return;
    if (!text.trim() && !attachedFile) return;

    setLoading(true);
    abortRef.current = new AbortController();
    setText("");
    try {
      let activeChatId = chatId;
      if (!activeChatId) {
        activeChatId = await createNewChat();
        if (!activeChatId) throw new Error("Failed to create chat");
      }

      // 1️⃣ Upload PDF first
      if (attachedFile) {
        const formData = new FormData();
        // formData.append("file", attachedFile);
        formData.append("file", attachedFile);
        formData.append("chatId", activeChatId);

        await fetch("/api/uploadPdf", {
          method: "POST",
          body: formData,
          signal: abortRef.current.signal,
        });
      }

      setMessages((prev) => {
        const updated = [...prev];

        // If PDF attached → show file message
        if (attachedFile) {
          updated.push({
            role: "user",
            type: "file",
            fileName: attachedFile.name,
            content: "",
          });
        }

        // If text exists → show text message
        if (text.trim()) {
          updated.push({
            role: "user",
            type: "text",
            content: text.trim(),
          });
        }

        return updated;
      });

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        // body: JSON.stringify({
        //   chatId: activeChatId,
        //   question: text.trim(),
        // }),
        body: JSON.stringify({
          chatId: activeChatId,
          question: text.trim(),
          hasFile: !!attachedFile,
          fileName: attachedFile?.name ?? null,
        }),
      });
      console.log(res, "RESPONSE OF INPUT API/ASK");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content: data.answer || "Sorry, I couldn't generate a response.",
        },
      ]);

      onMessageSent?.();

      // 4️⃣ Reset UI

      setAttachedFile(null);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⏹️ Response stopped." },
        ]);
      } else {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Something went wrong. Please try again.",
          },
        ]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="bg-[#131314] pb-6 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Input Container */}
        <div className="flex  items-center gap-2 bg-[#1e1f20] rounded-[26px] px-3 py-2 border border-[#2a2b2c]">
          {/* Upload */}
          <button
            onClick={handlePickFile}
            className="p-2 text-[#c4c7c5] cursor-pointer hover:text-white hover:bg-[#2a2b2c] rounded-full transition"
            title="Upload PDF"
          >
            <Plus size={20} />
          </button>

          {/* Attachment chip */}
          {attachedFile && (
            <div className="flex items-center gap-2 bg-[#2a2b2c] px-3 py-1 rounded-full text-xs max-w-[220px] truncate">
              <span className="text-white truncate">
                📄 {attachedFile.name}
              </span>

              <button
                onClick={() => setAttachedFile(null)}
                className="text-[#8e918f] hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask something or upload a PDF..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-white outline-none leading-relaxed placeholder:text-[#8e918f]"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setAttachedFile(file);
            }}
          />

          {/* Send / Stop */}
          <div className="flex items-center">
            {loading ? (
              <button
                onClick={handleStop}
                className="p-2 rounded-full cursor-pointer bg-[#2a2b2c] hover:bg-[#3a3b3c] text-red-400 transition"
                title="Stop generating"
              >
                <StopCircle size={20} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!text.trim() && !attachedFile}
                className="p-2 rounded-full cursor-pointer bg-[#4285f4] hover:bg-[#5a95f5] disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Send"
              >
                <SendHorizontal size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Input;
