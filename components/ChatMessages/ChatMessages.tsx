"use client";

import React, { useRef } from "react";

import { Send, StopCircle, Bot, User, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export type Message = {
  role: "user" | "assistant";

  content: string;
  fileName?: string;
  type?: "text" | "file";
};

const ChatMessages = ({ messages = [] }: { messages?: Message[] }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#131314] text-[#e3e3e3]">
      <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="pt-1">
              {msg.role === "assistant" ? (
                <Bot size={18} />
              ) : (
                <User size={18} />
              )}
            </div>
            {/* <div className="whitespace-pre-wrap">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div> */}
            <div className="whitespace-pre-wrap">
              {msg.type === "file" ? (
                <div className="flex items-center gap-2 bg-[#1e1f20] px-3 py-2 rounded-lg text-sm">
                  📄 <span className="truncate">{msg.fileName}</span>
                </div>
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
            </div>
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
