// Corre DESPUÉS del build de producción (ver scripts/vercel-build.sh), sobre el árbol final
// mergeado en apps/dashboard/dist -- ahí ya conviven el bundle del dashboard, la landing y el
// export web de mobile (copiado bajo dist/app). No esconde el código de verdad: el navegador
// tiene que descargarlo y ejecutarlo, así que cualquiera con suficiente empeño puede
// desofuscarlo. Lo que sí logra es que "Inspeccionar" ya no muestre nombres de variables/
// funciones legibles ni la estructura original -- min+ofuscado en vez de código fuente limpio.
//
// Deliberadamente NO se usa selfDefending/debugProtection: rompen con algunas extensiones de
// navegador y herramientas legítimas de monitoreo (Sentry, etc.), y no aportan nada real contra
// alguien que de verdad quiera leer el código -- solo inflan el bundle y friccionan a usuarios
// normales sin ganancia de seguridad.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const targetDir = process.argv[2];
if (!targetDir) {
  console.error('Uso: node scripts/obfuscate-build.mjs <carpeta-de-build>');
  process.exit(1);
}

// Dos problemas reales medidos en este mismo build contra el bundle web de mobile (un solo
// archivo de 7.84 MB, sin code-splitting):
// 1) controlFlowFlattening + deadCodeInjection tronaban el proceso con "JavaScript heap out of
//    memory" incluso con --max-old-space-size alto -- son, con diferencia, las transformaciones
//    más caras en memoria/CPU.
// 2) Incluso el preset MÁS liviano posible (solo renombrar identificadores, nada de string
//    array/control flow/dead code) igual infla el archivo ~55% (7.84 MB -> 12.18 MB): Metro ya
//    minificó a nombres de 1-2 caracteres, y el generador hexadecimal usa nombres más largos --
//    es un costo inherente de cualquier renombrado aplicado después de una minificación real, no
//    algo evitable con más ajustes.
// Dado eso, por encima del umbral se usa el preset MÁS barato posible (identificadores + compact
// nada más, +muhco menos peso que agregar encima string array) en vez de las opciones completas.
const TAMANO_UMBRAL_LIVIANO = 2 * 1024 * 1024; // 2 MB

const OPCIONES_BASE = {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  simplify: true,
  unicodeEscapeSequence: false,
  sourceMap: false,
};

const OPCIONES_COMPLETAS = {
  ...OPCIONES_BASE,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.3,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.1,
  numbersToExpressions: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
};

const OPCIONES_LIVIANAS = {
  ...OPCIONES_BASE,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  numbersToExpressions: false,
  splitStrings: false,
  stringArray: false,
  transformObjectKeys: false,
};

function listJsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      out.push(...listJsFiles(full));
    } else if (extname(entry) === '.js') {
      out.push(full);
    }
  }
  return out;
}

const files = listJsFiles(targetDir);
if (files.length === 0) {
  console.warn(`[obfuscate-build] No se encontraron archivos .js en ${targetDir}`);
  process.exit(0);
}

let ok = 0;
let failed = 0;
let liviano = 0;
for (const file of files) {
  try {
    const source = readFileSync(file, 'utf8');
    const esGrande = Buffer.byteLength(source, 'utf8') > TAMANO_UMBRAL_LIVIANO;
    if (esGrande) liviano += 1;
    const result = JavaScriptObfuscator.obfuscate(source, esGrande ? OPCIONES_LIVIANAS : OPCIONES_COMPLETAS);
    writeFileSync(file, result.getObfuscatedCode(), 'utf8');
    ok += 1;
  } catch (error) {
    // Best-effort: si un archivo puntual falla (p.ej. sintaxis que el parser no soporta aún, o
    // se queda sin memoria incluso con el preset liviano), se deja tal cual minificado por
    // Vite/Metro en vez de romper el deploy entero.
    console.warn(`[obfuscate-build] No se pudo ofuscar ${file}: ${error.message}`);
    failed += 1;
  }
}

console.log(`[obfuscate-build] Ofuscados ${ok}/${files.length} archivos en ${targetDir}${liviano ? ` (${liviano} con preset liviano por tamaño)` : ''}${failed ? ` (${failed} sin tocar por error)` : ''}.`);
