import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Text as NativeText, TextInput as NativeTextInput, TextInputProps, TextProps } from 'react-native';
import { useTranslation } from 'react-i18next';
import { translateWithApi } from './translatorApi';

const SOURCE_LANGUAGE = 'es';
const BRAND_TERMS = ['Nexxus'];

type AdminTranslationContextValue = {
  protectedTerms: string[];
};

const AdminTranslationContext = createContext<AdminTranslationContextValue>({ protectedTerms: BRAND_TERMS });

const normalizeTerm = (value: string) => value.trim().toLowerCase();

const SPANISH_SOURCE_WORDS = [
  'accion',
  'acciones',
  'activo',
  'activos',
  'advertencia',
  'agenda',
  'alerta',
  'alertas',
  'aprobacion',
  'aprobaciones',
  'auditoria',
  'banco',
  'buscar',
  'calendario',
  'cargo',
  'cargos',
  'carga',
  'cerrar',
  'centro',
  'colaborador',
  'colaboradores',
  'comunicacion',
  'con',
  'configuracion',
  'contrasena',
  'correo',
  'cuenta',
  'de',
  'del',
  'departamento',
  'departamentos',
  'descripcion',
  'detalle',
  'empleado',
  'empleados',
  'empresa',
  'empresas',
  'en',
  'estado',
  'estres',
  'evento',
  'eventos',
  'exportar',
  'fecha',
  'generar',
  'gestion',
  'guardar',
  'hora',
  'idioma',
  'la',
  'las',
  'los',
  'nombre',
  'nomina',
  'nuevo',
  'nueva',
  'operativo',
  'para',
  'pago',
  'pagos',
  'pendiente',
  'pendientes',
  'plantilla',
  'por',
  'proximo',
  'proximos',
  'que',
  'rendimiento',
  'respaldar',
  'respaldo',
  'riesgo',
  'rol',
  'roles',
  'salario',
  'se',
  'sede',
  'sedes',
  'sesion',
  'sin',
  'sistema',
  'tarea',
  'tareas',
  'telefono',
  'tema',
  'todos',
  'ubicacion',
  'usuario',
  'usuarios',
  'y',
];

const removeAccents = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const looksLikeSpanishSource = (text: string) => {
  const clean = text.trim();
  if (/[ÁÉÍÓÚÜÑáéíóúüñ¿¡]/.test(clean)) return true;

  const words = removeAccents(clean.toLowerCase()).match(/[a-z]+/g) || [];
  return words.some((word) => SPANISH_SOURCE_WORDS.includes(word));
};

const uniqueTerms = (terms: string[]) => {
  const seen = new Set<string>();
  return terms
    .map((term) => (typeof term === 'string' ? term.trim() : ''))
    .filter((term) => {
      if (!term || seen.has(normalizeTerm(term))) return false;
      seen.add(normalizeTerm(term));
      return true;
    })
    .sort((a, b) => b.length - a.length);
};

const shouldSkipTranslation = (text: string, protectedTerms: string[]) => {
  const clean = text.trim();
  if (!clean) return true;
  if (clean.length <= 1) return true;
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(clean)) return true;
  if (/^https?:\/\//i.test(clean) || clean.includes('@')) return true;
  if (/^[A-Z0-9._-]{2,}$/.test(clean) && !/[ÁÉÍÓÚÜÑáéíóúüñ]/.test(clean)) return true;
  return protectedTerms.some((term) => normalizeTerm(term) === normalizeTerm(clean));
};

const protectTerms = (text: string, protectedTerms: string[]) => {
  const terms: string[] = [];
  let protectedText = text;

  protectedTerms.forEach((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matcher = new RegExp(escaped, 'gi');
    protectedText = protectedText.replace(matcher, (match) => {
      const token = `NEXXUSTERMPROTECTED${terms.length}`;
      terms.push(match);
      return token;
    });
  });

  return {
    protectedText,
    restore: (translated: string) =>
      terms.reduce(
        (result, term, index) =>
          result.replace(new RegExp(`NEXXUSTERMPROTECTED\\s*${index}`, 'gi'), term),
        translated
      ),
  };
};

export const translateAdminProtectedString = async (
  source: string,
  target: string,
  protectedTerms: string[]
) => {
  const terms = uniqueTerms([...BRAND_TERMS, ...protectedTerms]);
  const normalizedTarget = target?.startsWith('en') ? 'en' : SOURCE_LANGUAGE;

  if (normalizedTarget === SOURCE_LANGUAGE || shouldSkipTranslation(source, terms)) return source;
  if (normalizedTarget === 'en' && !looksLikeSpanishSource(source)) return source;

  const leading = source.match(/^\s*/)?.[0] || '';
  const trailing = source.match(/\s*$/)?.[0] || '';
  const cleanSource = source.trim();
  const { protectedText, restore } = protectTerms(cleanSource, terms);
  const translated = await translateWithApi(protectedText, normalizedTarget);

  return `${leading}${restore(translated)}${trailing}`;
};

export const useAdminProtectedTerms = () => {
  const { protectedTerms } = useContext(AdminTranslationContext);
  return useMemo(() => uniqueTerms([...BRAND_TERMS, ...protectedTerms]), [protectedTerms]);
};

const useAdminTextTranslation = (source: string) => {
  const { i18n } = useTranslation();
  const protectedTerms = useAdminProtectedTerms();
  const [translated, setTranslated] = useState(source);

  useEffect(() => {
    let active = true;
    const target = i18n.language?.startsWith('en') ? 'en' : SOURCE_LANGUAGE;

    const translate = async () => {
      const result = await translateAdminProtectedString(source, target, protectedTerms);
      if (active) setTranslated(result);
    };

    translate();
    return () => {
      active = false;
    };
  }, [i18n.language, source, protectedTerms]);

  return translated;
};

const TranslatedString = ({ value }: { value: string }) => {
  const translated = useAdminTextTranslation(value);
  return <>{translated}</>;
};

const translateChildren = (children: React.ReactNode): React.ReactNode => {
  if (typeof children === 'string') return <TranslatedString value={children} />;
  if (Array.isArray(children)) {
    return children.map((child, index) => (
      <React.Fragment key={`admin-text-${index}`}>{translateChildren(child)}</React.Fragment>
    ));
  }
  return children;
};

export function AdminTranslationProvider({
  children,
  protectedTerms = [],
}: {
  children: React.ReactNode;
  protectedTerms?: string[];
}) {
  const value = useMemo(
    () => ({ protectedTerms: uniqueTerms([...BRAND_TERMS, ...protectedTerms]) }),
    [protectedTerms]
  );

  return <AdminTranslationContext.Provider value={value}>{children}</AdminTranslationContext.Provider>;
}

export function AdminTranslatedText({ children, ...props }: TextProps) {
  return <NativeText {...props}>{translateChildren(children)}</NativeText>;
}

export function AdminTranslatedTextInput({ placeholder, ...props }: TextInputProps) {
  const translatedPlaceholder = useAdminTextTranslation(
    typeof placeholder === 'string' ? placeholder : ''
  );

  return (
    <NativeTextInput
      {...props}
      placeholder={typeof placeholder === 'string' ? translatedPlaceholder : placeholder}
    />
  );
}
