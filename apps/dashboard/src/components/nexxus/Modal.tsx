import { useEffect } from "react";
import { MdClose } from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";

export default function Modal({ isOpen, onClose, title, children, width = "max-w-2xl" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm dark:bg-navy-900/80"
      onClick={onClose}
    >
      <div 
        className={`w-full ${width} animate-fade-in-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <NexxusCard extra="w-full p-6 shadow-2xl relative">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
            {title && (
              <h2 className="text-xl font-bold text-navy-700 dark:text-white">
                {title}
              </h2>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto px-1">
            {children}
          </div>
        </NexxusCard>
      </div>
    </div>
  );
}
