process.env.GEMINI_API_KEY = "AQ.Ab8RN6LSO-zni600FpzCUoyyoCjFdE4xFaakw4RbZrF0KZ249g";

const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const { callGemini } = require("./index");

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'nexxus-firebase-project' });
}

const caller = {
  id: "user-test",
  rol: "admin",
  empresaId: "empresa-test"
};

const prompt = "agenda una reunión para mañana a las 10 am para hablar sobre el proyecto. ID del empleado: user-12345";
const response = {
  tool: "company_summary",
  respuesta: "Resumen...",
  fuentes: []
};

async function run() {
  try {
    console.log("Iniciando llamada a Gemini...");
    const gemini = await callGemini({ caller, prompt, response, history: [] });
    console.log("GEMINI RESPONDIO:\n", gemini.text);
  } catch (err) {
    console.error("ERROR LLAMANDO A GEMINI:", err);
  } finally {
    process.exit(0);
  }
}
run();
