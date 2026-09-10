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
  'acceso',
  'activo',
  'activos',
  'actividad',
  'administrador',
  'advertencia',
  'agenda',
  'agregar',
  'ajusta',
  'alerta',
  'alertas',
  'alto',
  'anomalia',
  'anomalias',
  'anuncio',
  'anuncios',
  'añadido',
  'añadir',
  'apariencia',
  'aprobacion',
  'aprobaciones',
  'asentamiento',
  'asistencia',
  'auditoria',
  'ausencia',
  'ausencias',
  'autenticacion',
  'banco',
  'balance',
  'baja',
  'bajas',
  'bruto',
  'buscar',
  'calendario',
  'canal',
  'canales',
  'cargo',
  'cargos',
  'carga',
  'cerrar',
  'centro',
  'claro',
  'colaborador',
  'colaboradores',
  'comunicacion',
  'con',
  'configuracion',
  'contrasena',
  'contraste',
  'copiada',
  'copiado',
  'correo',
  'costo',
  'correcto',
  'correctamente',
  'cristal',
  'cuenta',
  'datos',
  'de',
  'del',
  'departamento',
  'departamentos',
  'descripcion',
  'detalle',
  'editar',
  'eliminado',
  'eliminados',
  'eliminar',
  'empleado',
  'empleados',
  'emocional',
  'empresa',
  'empresas',
  'en',
  'escuro',
  'estado',
  'estable',
  'estructura',
  'excelente',
  'exito',
  'exitosos',
  'estres',
  'evento',
  'eventos',
  'exportar',
  'fecha',
  'foto',
  'fue',
  'fuerte',
  'generar',
  'general',
  'gestion',
  'guardar',
  'hechos',
  'hora',
  'humanos',
  'idioma',
  'importar',
  'importados',
  'informacion',
  'intenta',
  'intentar',
  'la',
  'laborado',
  'laborales',
  'las',
  'limpia',
  'logs',
  'lunes',
  'los',
  'modulos',
  'modo',
  'nombre',
  'neto',
  'nomina',
  'novedades',
  'nuevamente',
  'nuevo',
  'nueva',
  'operativo',
  'operador',
  'operacion',
  'operaciones',
  'organizativa',
  'oscuro',
  'panel',
  'para',
  'pagado',
  'pagada',
  'pago',
  'pagos',
  'pendiente',
  'pendientes',
  'perfil',
  'permisos',
  'plantilla',
  'planilla',
  'portapapeles',
  'por',
  'preferencias',
  'prioridad',
  'prioridades',
  'procesos',
  'prom',
  'publicar',
  'publicado',
  'privilegios',
  'propietario',
  'proximo',
  'proximos',
  'que',
  'receptores',
  'recursos',
  'rediseno',
  'rendimiento',
  'reporte',
  'reportes',
  'respaldar',
  'respaldo',
  'riesgo',
  'rol',
  'roles',
  'salario',
  'se',
  'sede',
  'sedes',
  'seguridad',
  'sesion',
  'sesiones',
  'sin',
  'sistema',
  'soporte',
  'superficies',
  'tarea',
  'tareas',
  'telefono',
  'tema',
  'texto',
  'tiempo',
  'todos',
  'total',
  'ubicacion',
  'usuario',
  'usuarios',
  'version',
  'visual',
  'workspace',
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

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_REGEX = /https?:\/\/[^\s]+/gi;

const shouldSkipTranslation = (text: string, protectedTerms: string[]) => {
  const clean = text.trim();
  if (!clean) return true;
  if (clean.length <= 1) return true;
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(clean)) return true;
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
  const emails = source.match(EMAIL_REGEX) || [];
  const urls = source.match(URL_REGEX) || [];
  const dynamicProtected = [...emails, ...urls];

  const terms = uniqueTerms([...BRAND_TERMS, ...protectedTerms, ...dynamicProtected]);
  const normalizedTarget = target?.startsWith('en') ? 'en' : SOURCE_LANGUAGE;

  let strippedSource = source;
  dynamicProtected.forEach((term) => {
    strippedSource = strippedSource.replace(term, ' ');
  });

  if (normalizedTarget === SOURCE_LANGUAGE || shouldSkipTranslation(strippedSource, terms)) return source;
  if (normalizedTarget === 'en' && !looksLikeSpanishSource(strippedSource)) return source;

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
  return <NativeText>{translated}</NativeText>;
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

function AdminTranslatedSingleText({ text, ...props }: { text: string } & TextProps) {
  const translated = useAdminTextTranslation(text);
  return <NativeText {...props}>{translated}</NativeText>;
}

export function AdminTranslatedText({ children, ...props }: TextProps) {
  if (typeof children === 'string') {
    return <AdminTranslatedSingleText text={children} {...props} />;
  }
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

/**
 * Alias neutros para usar el mismo mecanismo de traducción dinámica fuera de
 * pantallas de admin (empleado, superadmin) sin la connotación "Admin" en el nombre.
 */
export const TranslatedText = AdminTranslatedText;
export const TranslatedTextInput = AdminTranslatedTextInput;
export const TranslationProvider = AdminTranslationProvider;
