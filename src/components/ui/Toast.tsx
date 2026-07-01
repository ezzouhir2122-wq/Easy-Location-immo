"use client";
import { useEffect } from "react";

type Props = {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

export default function Toast({ message, type = "success", onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white text-sm font-medium"
      style={{
        background: type === "success" ? "#10B981" : "#EF4444",
        animation: "slideUp 0.2s ease-out",
      }}
    >
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <span>{type === "success" ? "✓" : "✕"}</span>
      {message}
    </div>
  );
}
