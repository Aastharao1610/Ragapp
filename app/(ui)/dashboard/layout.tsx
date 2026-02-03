"use client";

import Header from "@/components/Header/Header";
import Sidebar from "@/components/Siderbar/SIderbar";
import ChatMessages from "@/components/ChatMessages/ChatMessages";
import Input from "@/components/Input/Input";
import { useState, useRef, useEffect } from "react";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Message } from "@/components/ChatMessages/ChatMessages";
import { useAuth } from "@clerk/nextjs";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatRefreshKey, setChatRefreshKey] = useState(0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  console.log(isSignedIn , "isSIGENDDDDINNNN")
  console.log("📊 DASHBOARD RENDER:", {
    isLoaded,
    isSignedIn,
  });
  

  useEffect(() => {
    // console.log("📊 DASHBOARD EFFECT:", { isLoaded, isSignedIn });
    if (isLoaded && !isSignedIn) {
      console.log("⛔ DASHBOARD REDIRECTING TO /");
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (window.innerWidth > 768) {
        if (
          sidebarRef.current &&
          !sidebarRef.current.contains(e.target as Node)
        ) {
          closeSidebar();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  if (!isLoaded) {
    return null;
  }
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const loadChat = async (id: string) => {
    setChatId(id);
    const res = await fetch(`/api/messages/${id}`);
    const data = await res.json();
    console.log(data , "dataaa")
    
    setMessages(data);

    if (window.innerWidth < 768) {
      closeSidebar();
    }
  };


  const createNewChat = async () => {
    const res = await fetch("/api/chat", { method: "POST" });
    console.log(res , "response of chat")
    if (!res.ok) return;

    const data = await res.json();
    console.log(data , "dataaa")
    setMessages([]);
    setChatId(data.id);
    setChatRefreshKey((prev) => prev + 1);

    if (window.innerWidth < 768) {
      closeSidebar();
    }
    return data.id;
  };
  const saveDraft = () => {
    setMessages([]);
    setChatId(null);
  };
  const handleDeleteChat = (deletedId: string) => {
    if (deletedId === chatId) {
      console.log("🧹 Clearing active chat because it was deleted");
      setChatId(null);
      setMessages([]); // 🔥 clear instantly
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#0f0f10] text-white">
      {/* Floating open button */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-5 left-5 z-[60] p-2 rounded-full 
            bg-[#1e1f20] hover:bg-[#333537] 
            border border-[#333] shadow-md cursor-pointer"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar wrapper with ref */}
      <div ref={sidebarRef}>
        <Sidebar
         authReady={isLoaded && isSignedIn}
          onNewChat={saveDraft}
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          activeChatId={chatId}
          onSelectChat={loadChat}
          // onNewChat={createNewChat}
          refreshKey={chatRefreshKey} 
          onDelete={handleDeleteChat}
        />
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1">
        <Header />
        <ChatMessages messages={messages} />
        {/* <Input setMessages={setMessages} chatId={chatId} /> */}
        <Input
          setMessages={setMessages}
          chatId={chatId}
          createNewChat={createNewChat}
          onMessageSent={() => {
            // Immediate refresh
            setChatRefreshKey((prev) => prev + 1);

            // Delayed refresh (backend title generation lag)
            setTimeout(() => {
              setChatRefreshKey((prev) => prev + 1);
            }, 1200);
          }}
        />
      </div>

      {children}
    </div>
  );
}
