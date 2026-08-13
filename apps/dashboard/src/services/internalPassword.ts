// Puerto a Web Crypto de nexxus/backend/passwords.js (hashInternalPassword). Mismo algoritmo,
// mismo formato de salida ("pbkdf2_sha256$iteraciones$salt$hash") para que
// verifyInternalPassword en el backend (usado por loginEmpresarial) pueda validar contraseñas
// creadas desde aqui. Las reglas de Firestore bloquean guardar "passwordInterno" en texto plano
// en creates (sinPasswordPlanoEnCreate) -- por eso hace falta hashear en el cliente en vez de
// simplemente escribir la contraseña tal cual.
const ALGORITHM = "pbkdf2_sha256";
const ITERATIONS = 210000;

function toBase64Url(bytes) {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toBase64(bytes) {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

export async function hashInternalPassword(password) {
  const saltRandomBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = toBase64Url(saltRandomBytes);
  // Node's crypto.pbkdf2Sync(password, salt, ...) recibe "salt" como STRING y lo codifica como
  // utf8 internamente -- no son los bytes aleatorios crudos, son los bytes UTF-8 del string
  // base64url ya generado. Hay que replicar exactamente eso para que el hash coincida.
  const saltBytesForKdf = new TextEncoder().encode(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytesForKdf, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hash = toBase64(new Uint8Array(bits));
  return `${ALGORITHM}$${ITERATIONS}$${salt}$${hash}`;
}
