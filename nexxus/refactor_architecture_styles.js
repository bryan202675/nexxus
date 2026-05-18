/**
 * Documentacion Nexxus - nexxus/refactor_architecture_styles.js
 * Capa: app.
 * Proposito: Modulo refactor_architecture_styles. Agrupa logica, tipos o configuracion usados por la app Nexxus.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa fs; usa utilidades de Node necesarias para scripts o configuracion local.
const fs = require('fs');
// Importa path; usa utilidades de Node necesarias para scripts o configuracion local.
const path = require('path');

/**
 * Declaracion walk. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function walk(dir) {
  // Declara results; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let results = [];
  // Declara list; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const list = fs.readdirSync(dir);
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  list.forEach(file => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    file = path.join(dir, file);
    // Declara stat; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const stat = fs.statSync(file);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (stat && stat.isDirectory()) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      results = results.concat(walk(file));
    } else {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return results;
}

/**
 * Declaracion files. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const files = walk('app/src/presentation/screens');

// Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
files.forEach(file => {
  // Declara content; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let content = fs.readFileSync(file, 'utf-8');
  // Declara original; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let original = content;

  // Add the round blurred NavBar everywhere
  const appBarRegex = /(appBar:\s*\{)([^}]*)(\})/;
  // Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
  content = content.replace(appBarRegex, (match, p1, p2, p3) => {
    // Declara newMatch; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let newMatch = p2;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    newMatch = newMatch.replace(/paddingHorizontal:\s*[^,]+,/, 'paddingHorizontal: ESPACIADO.lg,');
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    newMatch = newMatch.replace(/backgroundColor:\s*[^,]+,/, '');
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    newMatch = newMatch.replace(/borderBottomWidth:\s*[^,]+,/, '');
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    newMatch = newMatch.replace(/borderBottomColor:\s*[^,]+,/, '');
    
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!newMatch.includes('borderRadius:')) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      newMatch += `  borderRadius: RADIOS.xxl, marginHorizontal: ESPACIADO.md, marginTop: Platform.OS === 'ios' ? 0 : ESPACIADO.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)', overflow: 'hidden', backgroundColor: 'transparent', `;
    } else {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      newMatch = newMatch.replace(/borderRadius:\s*[^,]+,/, 'borderRadius: RADIOS.xxl,');
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return p1 + newMatch + p3;
  });

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (content !== original && !content.includes('Platform.OS')) {
     // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
     content = content.replace(/import \{/i, 'import { Platform, ');
  }

  // Restore the white backgrounds with fade effect
  content = content.replace(/backgroundColor:\s*'#fff'/g, "backgroundColor: 'rgba(255, 255, 255, 0.92)'");
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  content = content.replace(/backgroundColor:\s*'rgba\(255,\s*255,\s*255,\s*0\.7\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.92)'");
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  content = content.replace(/backgroundColor:\s*'rgba\(255,\s*255,\s*255,\s*0\.85\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.92)'");
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  content = content.replace(/backgroundColor:\s*'rgba\(255,\s*255,\s*255,\s*0\.8\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.92)'");

  // Fix BlurView usage to be consistent
  content = content.replace(/<BlurView intensity=\{70\} tint="light"/g, '<BlurView intensity={40} tint="light"');
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  content = content.replace(/<BlurView intensity=\{50\} tint="transparent"/g, '<BlurView intensity={40} tint="light"');

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (content !== original) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    fs.writeFileSync(file, content, 'utf-8');
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.log('Updated', file);
  }
});
