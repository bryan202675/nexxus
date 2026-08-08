import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import {
  MdOutlineDashboard,
  MdOutlinePerson,
  MdOutlineStorefront,
  MdOutlineWork,
  MdOutlineBusiness,
  MdOutlineDescription,
  MdOutlineInventory2,
  MdChevronRight,
} from "react-icons/md";
import { useAuth } from "context/AuthContext";
import { getRoutesForRole } from "routes";
import { supabase } from "supabaseClient/supabaseConfig";

const BADGE_STYLES = {
  Sección: "bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300",
  Empleado: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300",
  Sede: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300",
  Cargo: "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300",
  Departamento: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300",
  Documento: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300",
  Inventario: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300",
};

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { esSuperAdmin, empresaId } = useAuth();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = containerRef.current?.querySelector("input");
        if (input) input.focus();
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Perform search when query changes
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let isCancelled = false;

    const performSearch = async () => {
      const searchResults = [];

      // 1. Dashboard Sections / Routes
      const routes = getRoutesForRole(esSuperAdmin ? "super_admin" : "admin_empresa");
      const matchedRoutes = routes.filter((r) =>
        r.name?.toLowerCase().includes(trimmed)
      );
      matchedRoutes.forEach((r) => {
        searchResults.push({
          id: `route-${r.path}`,
          title: r.name,
          subtitle: "Apartado del Dashboard",
          type: "Sección",
          icon: <MdOutlineDashboard className="h-5 w-5 text-brand-500 dark:text-brand-400" />,
          action: () => navigate(`${r.layout}/${r.path}`),
        });
      });

      // 2. Database entity searches for Company Admin
      if (empresaId) {
        try {
          // Empleados / Usuarios
          const { data: usuarios } = await supabase
            .from("usuarios")
            .select("id, nombre, email, rol")
            .eq("empresa_id", empresaId)
            .or(`nombre.ilike.%${trimmed}%,email.ilike.%${trimmed}%,rol.ilike.%${trimmed}%`)
            .limit(5);

          (usuarios || []).forEach((u) => {
            searchResults.push({
              id: `user-${u.id}`,
              title: u.nombre || u.email,
              subtitle: `${u.email || ""} • ${u.rol || "Empleado"}`,
              type: "Empleado",
              icon: <MdOutlinePerson className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
              action: () => navigate(`/admin/empresa-plantilla?search=${encodeURIComponent(u.nombre || u.email)}`),
            });
          });

          // Sedes
          const { data: sedes } = await supabase
            .from("sedes")
            .select("id, nombre, direccion")
            .eq("empresa_id", empresaId)
            .ilike("nombre", `%${trimmed}%`)
            .limit(5);

          (sedes || []).forEach((s) => {
            searchResults.push({
              id: `sede-${s.id}`,
              title: s.nombre,
              subtitle: s.direccion || "Sede empresarial",
              type: "Sede",
              icon: <MdOutlineStorefront className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />,
              action: () => navigate("/admin/empresa-organizacion?tab=sedes"),
            });
          });

          // Cargos / Puestos
          const { data: cargos } = await supabase
            .from("cargos")
            .select("id, nombre, descripcion")
            .eq("empresa_id", empresaId)
            .ilike("nombre", `%${trimmed}%`)
            .limit(5);

          (cargos || []).forEach((c) => {
            searchResults.push({
              id: `cargo-${c.id}`,
              title: c.nombre,
              subtitle: c.descripcion || "Cargo de plantilla",
              type: "Cargo",
              icon: <MdOutlineWork className="h-5 w-5 text-purple-500 dark:text-purple-400" />,
              action: () => navigate("/admin/empresa-organizacion?tab=cargos"),
            });
          });

          // Departamentos
          const { data: departamentos } = await supabase
            .from("departamentos")
            .select("id, nombre")
            .eq("empresa_id", empresaId)
            .ilike("nombre", `%${trimmed}%`)
            .limit(5);

          (departamentos || []).forEach((d) => {
            searchResults.push({
              id: `dept-${d.id}`,
              title: d.nombre,
              subtitle: "Departamento",
              type: "Departamento",
              icon: <MdOutlineBusiness className="h-5 w-5 text-amber-500 dark:text-amber-400" />,
              action: () => navigate("/admin/empresa-organizacion?tab=departamentos"),
            });
          });

          // Documentos
          const { data: documentos } = await supabase
            .from("documentos")
            .select("id, titulo, nombre, categoria")
            .eq("empresa_id", empresaId)
            .or(`titulo.ilike.%${trimmed}%,nombre.ilike.%${trimmed}%,categoria.ilike.%${trimmed}%`)
            .limit(5);

          (documentos || []).forEach((doc) => {
            searchResults.push({
              id: `doc-${doc.id}`,
              title: doc.titulo || doc.nombre || "Documento",
              subtitle: doc.categoria || "Archivo de empresa",
              type: "Documento",
              icon: <MdOutlineDescription className="h-5 w-5 text-rose-500 dark:text-rose-400" />,
              action: () => navigate("/admin/empresa-documentos"),
            });
          });

          // Inventario / Activos
          const { data: inventario } = await supabase
            .from("inventario_activos")
            .select("id, nombre, codigo, categoria")
            .eq("empresa_id", empresaId)
            .or(`nombre.ilike.%${trimmed}%,codigo.ilike.%${trimmed}%,categoria.ilike.%${trimmed}%`)
            .limit(5);

          (inventario || []).forEach((inv) => {
            searchResults.push({
              id: `inv-${inv.id}`,
              title: inv.nombre,
              subtitle: `${inv.codigo ? `[${inv.codigo}] ` : ""}${inv.categoria || "Activo de inventario"}`,
              type: "Inventario",
              icon: <MdOutlineInventory2 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />,
              action: () => navigate("/admin/empresa-inventario"),
            });
          });
        } catch (err) {
          console.warn("Error en la búsqueda global:", err);
        }
      }

      if (!isCancelled) {
        setResults(searchResults);
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, empresaId, esSuperAdmin, navigate]);

  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery("");
    item.action();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[420px]">
      <div className="group flex h-[40px] w-full items-center gap-2.5 rounded-full bg-lightPrimary px-3.5 text-navy-700 transition-all duration-200 border border-transparent focus-within:border-brand-500/30 focus-within:ring-2 focus-within:ring-brand-500/20 dark:!bg-[#000000] dark:!border dark:!border-[#242427] dark:!text-white dark:focus-within:border-zinc-600">
        <FiSearch className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-focus-within:text-brand-500 dark:text-white/60 dark:group-focus-within:text-brand-400" />
        <input
          type="text"
          placeholder="Buscar apartados, empleados, sedes, documentos..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{ backgroundColor: "transparent" }}
          className="w-full !bg-transparent text-xs font-medium text-navy-700 outline-none placeholder:text-gray-400 dark:!text-white dark:placeholder:text-white/40 appearance-none shadow-none"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="rounded-full p-0.5 text-gray-400 transition hover:bg-gray-200/50 hover:text-gray-600 dark:text-white/50 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <FiX className="h-4 w-4" />
          </button>
        ) : (
          <span className="hidden sm:flex items-center gap-0.5 shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-400 shadow-sm border border-gray-200/80 dark:!bg-[#18181b] dark:!border-[#242427] dark:!text-zinc-400">
            ⌘K
          </span>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 top-12 z-50 w-full max-h-[380px] overflow-y-auto rounded-[20px] bg-white p-2.5 shadow-2xl shadow-shadow-500 border border-gray-100 dark:!bg-[#0a0a0a] dark:!border-[#242427] dark:shadow-none backdrop-blur-xl">
          {loading ? (
            <div className="p-4 text-center text-xs font-medium text-gray-500 dark:text-white/60">
              Buscando en toda la plataforma...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs font-medium text-gray-500 dark:text-white/60">
              No se encontraron coincidencias para &quot;{query}&quot;
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="flex items-center gap-3 rounded-xl p-2.5 text-left transition duration-150 hover:bg-lightPrimary dark:hover:bg-navy-800/80 group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100/80 dark:bg-navy-900 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-navy-700 truncate dark:text-white">
                        {item.title}
                      </p>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          BADGE_STYLES[item.type] || "bg-gray-100 text-gray-600 dark:bg-navy-900 dark:text-white/70"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-gray-500 truncate dark:text-white/50">
                      {item.subtitle}
                    </p>
                  </div>
                  <MdChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity dark:text-white/40" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
