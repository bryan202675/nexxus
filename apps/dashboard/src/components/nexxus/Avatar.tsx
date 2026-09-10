import { useState } from "react";

const GRADIENTS = [
  "bg-gradient-to-br from-indigo-500 to-purple-600 text-white",
  "bg-gradient-to-br from-blue-500 to-cyan-600 text-white",
  "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
  "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
  "bg-gradient-to-br from-rose-500 to-pink-600 text-white",
  "bg-gradient-to-br from-purple-500 to-pink-600 text-white",
  "bg-gradient-to-br from-brand-500 to-indigo-600 text-white",
  "bg-gradient-to-br from-teal-500 to-emerald-600 text-white",
];

const colorFor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % GRADIENTS.length;
  return GRADIENTS[Math.abs(hash)];
};

const initialsFor = (name?: string) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

const SIZES: Record<number, string> = {
  6: "h-6 w-6 text-[10px]",
  7: "h-7 w-7 text-[11px]",
  8: "h-8 w-8 text-xs",
  9: "h-9 w-9 text-xs",
  10: "h-10 w-10 text-sm",
  12: "h-12 w-12 text-base",
  14: "h-14 w-14 text-lg",
  16: "h-16 w-16 text-xl",
};

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

export default function Avatar({ src, name, size = 10, className = "" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const dimension = SIZES[size] || SIZES[10];

  const validSrc =
    !imgError &&
    typeof src === "string" &&
    src.trim().length > 4 &&
    src !== "null" &&
    src !== "undefined"
      ? src.trim()
      : null;

  if (validSrc) {
    return (
      <img
        className={`${dimension} shrink-0 rounded-full object-cover shadow-xs ${className}`}
        src={validSrc}
        alt={name || "avatar"}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${dimension} shrink-0 flex items-center justify-center rounded-full font-bold shadow-xs select-none ${colorFor(
        name || "?"
      )} ${className}`}
    >
      {initialsFor(name)}
    </div>
  );
}
