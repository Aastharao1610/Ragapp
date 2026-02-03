"use client";

import { useEffect, useState, useRef } from "react";
import { Menu, Search, MessageSquare, SquarePen, Ellipsis } from "lucide-react";
import DeleteModal from "../Modal/DeleteModal";
import { Trash2 } from "lucide-react";
import { Pencil } from "lucide-react";
import { createPortal } from "react-dom";


type Chat = {
  id: string;
  title: string | null;
};

const Sidebar = ({
  isOpen,
  onToggle,
  activeChatId,
  onSelectChat,
  onNewChat,
  refreshKey,
  authReady,
  onRename,
  onDelete,
}: {
  isOpen: boolean;
  onToggle: () => void;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  refreshKey: number;
  authReady: boolean;
  onRename: (updatedChat: Chat) => void;
  onDelete: (id: string) => void;
}) => {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    console.log("🔁 Sidebar useEffect triggered. refreshKey =", refreshKey);
    if (!authReady) {
      console.log("⏳ Sidebar waiting for auth...");
      return;
    }

    let cancelled = false;

    // console.log("✅ Sidebar fetching chats...");

    const loadChats = async () => {
      try {
        const res = await fetch("/api/getChats", {
          method : "GET",
          credentials: "include",
          cache: "no-store",


        });
console.log(res , "response of api get chat")
        if (!res.ok) {
          console.error("❌ getChats failed:", res.status);
          return;
        }

        const data = await res.json();

        console.log(data, "ssatata");
        if (!cancelled && Array.isArray(data)) {
          setChats(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Fetch chats error:", err);
        }
      }
    };

    loadChats();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, authReady]);

  const handleDelete = (id: string) => {
    console.log("🧹 Sidebar deleting:", id);
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    onDelete(id); // 🔥 notify parent
  };

  return (
    <aside
      className={`
    fixed top-0 left-0 z-[1000]
    h-screen w-[300px]
    bg-[#1e1f20] text-[#e3e3e3]
    flex flex-col font-sans
    transition-all duration-300 ease-in-out
    ${
      isOpen
        ? "translate-x-0 opacity-100"
        : "-translate-x-[320px] opacity-0 pointer-events-none"
    }
  `}
    >
      {/* Top Controls */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-[#333537] cursor-pointer rounded-full transition-colors"
        >
          <Menu size={20} />
        </button>

        <button className="p-2 hover:bg-[#333537] rounded-full transition-colors">
          <Search size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 py-2">
        <button
          onClick={onNewChat}
          className="flex items-center gap-3 px-4 py-3 bg-[#1a1b1c] hover:bg-[#333537] rounded-full text-sm font-medium transition-colors w-fit border border-transparent hover:border-[#444746]"
        >
          <SquarePen size={20} className="text-[#c4c7c5]" />
          <span className="pr-2">New chat</span>
        </button>
      </div>

      {/* History Label */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-sm font-medium text-[#e3e3e3]">Recent</p>
      </div>

      {/* Chat List */}
      <nav className="flex-1 overflow-y-auto px-2 pb-8 space-y-1 custom-scrollbar">
        {chats
          // .filter((chat) => chat.title && chat.title.trim() !== "")
          .map((chat) => (
            <ChatItem
              key={chat.id}
              id={chat.id}
              label={chat.title || "New Chat"}
              active={chat.id === activeChatId}
              onClick={() => onSelectChat(chat.id)}
              onRename={(updatedChat: Chat) => {
                setChats((prev) =>
                  prev.map((chat) =>
                    chat.id === updatedChat.id ? updatedChat : chat,
                  ),
                );
              }}
              onDelete={(id: string) => {
                handleDelete(id);
              }}
            />
          ))}
      </nav>
    </aside>
  );
};

function ChatItem({
  id,
  label,
  active = false,
  onClick,
  onRename,
  onDelete,
}: {
  id: string;
  label: string;
  active?: boolean;
  onClick: () => void;

  onRename: (updatedChat: Chat) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);

  useEffect(() => {
    setEditValue(label);
  }, [label]);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing]);

  const saveRename = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === label) {
      setIsEditing(false);
      return;
    }

    try {
      const res = await fetch(`/api/chat/${id}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });

      const updatedChat = await res.json();
      onRename({ id, title: trimmed });
    } catch (err) {
      console.error("Rename failed", err);
    } finally {
      setIsEditing(false);
    }
  };

  const deleteChat = async () => {
    try {
      setLoading(true);
      await fetch(`/api/chat/${id}`, {
        method: "DELETE",
      });

      onDelete(id);
      setShowDelete(false);
    } catch (error) {
      console.error("Delete Failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-all cursor-pointer truncate ${
          active
            ? "bg-[#004a77] text-[#c2e7ff] font-semibold"
            : "hover:bg-[#333537] text-[#c4c7c5]"
        }`}
      >
        <MessageSquare
          size={16}
          className={`shrink-0 ${active ? "text-[#c2e7ff]" : "text-[#c4c7c5]"}`}
        />

        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                saveRename();
              }
              if (e.key === "Escape") {
                setEditValue(label);
                setIsEditing(false);
              }
            }}
            className="
      flex-1 bg-transparent
      text-sm text-[#e3e3e3]
      outline-none
     selection:bg-blue-500
  selection:text-white
      focus:border-white/40
    "
          />
        ) : (
          <span className="truncate text-left flex-1">{label}</span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();

            const rect = e.currentTarget.getBoundingClientRect();

            setMenuPos({
              top: rect.bottom + 6,
              left: rect.right + 8,
            });

            setOpen(true);
          }}
          className="
    opacity-0 group-hover:opacity-100
    p-1.5 rounded-full
    transition cursor-pointer 
  "
        >
          <Ellipsis size={18} />
        </button>
      </button>

      {open &&
        menuPos &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999]"
            onClick={() => setOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                top: menuPos.top,
                left: menuPos.left,
              }}
              className="
          absolute
          w-44
          rounded-xl
          border border-white/10
          bg-[#1f2022]/95 backdrop-blur-md
          shadow-xl
          overflow-hidden
          animate-dropdown
        "
            >
              {/* Rename */}
              <button
                onClick={() => {
                  setIsEditing(true);
                  setOpen(false);
                }}
                className="
            flex w-full items-center gap-3
            px-4 py-2.5
            text-sm text-[#e5e7eb]
            hover:bg-white/10
            transition
          "
              >
                <Pencil size={16} className="text-[#c4c7c5]" />
                <span>Rename</span>
              </button>

              <div className="h-px bg-white/10 mx-2" />

              {/* Delete */}
              <button
                onClick={() => {
                  setShowDelete(true);
                  setOpen(false);
                }}
                className="
            flex w-full items-center gap-3
            px-4 py-2.5
            text-sm
            text-red-400
            hover:bg-red-500/10 hover:text-red-300
            transition
          "
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>,
          document.body,
        )}

      <DeleteModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={deleteChat}
        loading={loading}
        title="Delete this chat?"
      />
    </div>
  );
}

export default Sidebar;
