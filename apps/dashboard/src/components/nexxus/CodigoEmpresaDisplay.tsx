import React from "react";

/**
 * Formatea el código de empresa manteniendo exactamente la tipografía y color del texto original,
 * únicamente asegurando que el número '0' (cero) se muestre con la diagonal/slash en su interior.
 */
export default function CodigoEmpresaDisplay({ code, className = "" }) {
  if (!code) return "—";

  const chars = String(code).split("");

  return (
    <span className={`tracking-widest ${className}`}>
      {chars.map((char, idx) => {
        if (char === "0") {
          return (
            <span
              key={idx}
              className="inline-block relative font-mono font-extrabold slashed-zero"
              title="Número 0 (cero)"
            >
              0
            </span>
          );
        }
        return char;
      })}
    </span>
  );
}
