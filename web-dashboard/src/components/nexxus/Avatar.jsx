// Avatar real: foto/logo de Firebase/Cloudinary si existe, iniciales como respaldo.
// Reutilizado por Navbar (usuario en sesion), Empresas (logo) y Usuarios (foto de perfil).
const COLORS = ["bg-brand-500", "bg-blueSecondary", "bg-orange-500", "bg-green-500", "bg-red-500"];

const colorFor = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % COLORS.length;
  return COLORS[Math.abs(hash)];
};

const initialsFor = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

// Tailwind necesita clases estaticas (no puede detectar `h-${size}` en build), de ahi el mapa fijo.
const SIZES = {
  8: "h-8 w-8",
  9: "h-9 w-9",
  10: "h-10 w-10",
  12: "h-12 w-12",
  14: "h-14 w-14",
  16: "h-16 w-16",
};

export default function Avatar({ src, name, size = 10, className = "" }) {
  const dimension = SIZES[size] || SIZES[10];
  if (src) {
    return (
      <img
        className={`${dimension} rounded-full object-cover ${className}`}
        src={src}
        alt={name || "avatar"}
      />
    );
  }
  return (
    <div
      className={`${dimension} flex items-center justify-center rounded-full text-xs font-bold text-white ${colorFor(name || "?")} ${className}`}
    >
      {initialsFor(name)}
    </div>
  );
}
