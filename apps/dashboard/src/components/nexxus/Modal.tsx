import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-2xl",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-md transition-opacity duration-200 dark:bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${width} max-h-[90vh] flex flex-col rounded-[24px] bg-white p-6 shadow-2xl transition-all dark:border dark:border-white/10 dark:bg-charcoal dark:text-white`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
          {title ? (
            <h2 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              {title}
            </h2>
          ) : <div />}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white"
            aria-label="Cerrar modal"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-1 pr-2 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
