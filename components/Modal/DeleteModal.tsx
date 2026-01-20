"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

const DeleteModal = ({
  open,
  title = "Delete this chat?",
  onClose,
  onConfirm,
  loading = false,
}: Props) => {
  // ✅ Close on ESC key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // ✅ Portal to body
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose} // click outside close
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-[380px]
          rounded-xl
          bg-[#1e1f20]
          border border-[#333]
          p-5
          shadow-xl
          animate-modal-in
        "
      >
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>

        <p className="text-sm text-[#c4c7c5] mb-6">
          This action cannot be undone. The chat will be permanently deleted.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 cursor-pointer rounded-md text-sm bg-[#2a2b2d] hover:bg-[#333] transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 cursor-pointer rounded-md text-sm bg-red-600 hover:bg-red-700 text-white transition"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteModal;
