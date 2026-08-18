import React from 'react';

interface Props {
  texto: string;
  className?: string;
}

/**
 * RenderMarkdownWeb
 * Componente ligero para la web que parsea y renderiza el formato de texto de Nexxus IA,
 * eliminando artefactos crudos de Markdown (***, ###, ---, `* `) y transformándolos en
 * tipografía ejecutiva, viñetas elegantes, negritas y divisores sutiles.
 */
export default function RenderMarkdownWeb({ texto, className = '' }: Props) {
  if (!texto) return null;

  const parseInline = (lineaTexto: string, keyPrefix: string): React.ReactNode[] => {
    // Regex para detectar [enlaces](url), **negritas**, *cursivas*, `codigo`
    const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|`[^`]+`)/g;
    const partes = lineaTexto.split(regex);

    return partes.map((parte, index) => {
      if (!parte) return null;

      // Enlace: [texto](url)
      const matchLink = parte.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (matchLink) {
        return (
          <a
            key={`${keyPrefix}-link-${index}`}
            href={matchLink[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-500 underline underline-offset-2 hover:text-brand-600 dark:text-brand-400"
          >
            {matchLink[1]}
          </a>
        );
      }

      // Negrita: **texto** o __texto__
      if ((parte.startsWith('**') && parte.endsWith('**')) || (parte.startsWith('__') && parte.endsWith('__'))) {
        const contenido = parte.slice(2, -2);
        return (
          <strong key={`${keyPrefix}-bold-${index}`} className="font-bold text-inherit">
            {contenido}
          </strong>
        );
      }

      // Cursiva: *texto* o _texto_
      if ((parte.startsWith('*') && parte.endsWith('*')) || (parte.startsWith('_') && parte.endsWith('_'))) {
        const contenido = parte.slice(1, -1);
        return (
          <em key={`${keyPrefix}-italic-${index}`} className="italic text-inherit">
            {contenido}
          </em>
        );
      }

      // Código inline: `codigo`
      if (parte.startsWith('`') && parte.endsWith('`')) {
        const contenido = parte.slice(1, -1);
        return (
          <code
            key={`${keyPrefix}-code-${index}`}
            className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs text-inherit dark:bg-white/10"
          >
            {contenido}
          </code>
        );
      }

      // Texto plano
      return <React.Fragment key={`${keyPrefix}-txt-${index}`}>{parte}</React.Fragment>;
    });
  };

  const lineas = texto.split('\n');
  const bloques: React.ReactNode[] = [];

  lineas.forEach((lineaCruda, i) => {
    const linea = lineaCruda.trim();

    // Líneas vacías
    if (!linea) {
      bloques.push(<div key={`spacer-${i}`} className="h-1.5" />);
      return;
    }

    // Divisores horizontales (---, ___, ***)
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(linea)) {
      bloques.push(
        <hr key={`divider-${i}`} className="my-2.5 border-t border-black/10 dark:border-white/10" />
      );
      return;
    }

    // Encabezados H1 - H2 (# Titulo, ## Titulo)
    if (/^#{1,2}\s+/.test(linea)) {
      const contenido = linea.replace(/^#{1,2}\s+/, '');
      bloques.push(
        <h3 key={`h12-${i}`} className="mt-3 mb-1 text-base font-extrabold tracking-tight text-inherit">
          {parseInline(contenido, `h12-${i}`)}
        </h3>
      );
      return;
    }

    // Encabezados H3 - H4 (### Titulo, #### Titulo)
    if (/^#{3,4}\s+/.test(linea)) {
      const contenido = linea.replace(/^#{3,4}\s+/, '');
      bloques.push(
        <h4 key={`h34-${i}`} className="mt-2.5 mb-1 text-sm font-bold tracking-tight text-inherit">
          {parseInline(contenido, `h34-${i}`)}
        </h4>
      );
      return;
    }

    // Viñetas no ordenadas (* item, - item, • item)
    if (/^(\*|-|•)\s+/.test(linea)) {
      const contenido = linea.replace(/^(\*|-|•)\s+/, '');
      bloques.push(
        <div key={`bullet-${i}`} className="my-1 flex items-start gap-2 pl-1">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
          <div className="flex-1 text-sm leading-relaxed text-inherit">
            {parseInline(contenido, `b-${i}`)}
          </div>
        </div>
      );
      return;
    }

    // Listas ordenadas (1. item, 2. item, etc.)
    const matchOrdenada = linea.match(/^(\d+)\.\s+(.+)$/);
    if (matchOrdenada) {
      const numero = matchOrdenada[1];
      const contenido = matchOrdenada[2];
      bloques.push(
        <div key={`num-${i}`} className="my-1 flex items-start gap-2 pl-1">
          <span className="mt-0.5 min-w-[1.2rem] shrink-0 text-xs font-bold opacity-80">
            {numero}.
          </span>
          <div className="flex-1 text-sm leading-relaxed text-inherit">
            {parseInline(contenido, `n-${i}`)}
          </div>
        </div>
      );
      return;
    }

    // Párrafo normal
    bloques.push(
      <p key={`p-${i}`} className="my-1 text-sm leading-relaxed text-inherit">
        {parseInline(linea, `p-${i}`)}
      </p>
    );
  });

  return <div className={`space-y-0.5 text-left ${className}`}>{bloques}</div>;
}
