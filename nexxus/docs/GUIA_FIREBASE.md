# Guía Definitiva de Despliegue: Backend Nexxus en Firebase

Esta guía detalla el paso a paso exacto para montar tu infraestructura en la consola de Firebase, enlazar las credenciales con tu código y desplegar la seguridad y lógica que hemos construido.

---

## 1. Requisitos Previos
- Cuenta activa en [Google/Firebase](https://console.firebase.google.com/).
- Tener instalado Node.js (v18 o superior).
- Instalar las herramientas de línea de comandos de Firebase en tu computadora:
  ```bash
  npm install -g firebase-tools
  ```
- Iniciar sesión en Firebase CLI desde tu terminal:
  ```bash
  firebase login
  ```

---

## 2. Creación del Proyecto en la Consola
1. Entra a la [Consola de Firebase](https://console.firebase.google.com/) y haz clic en **Agregar proyecto**.
2. Nómbralo (ej. `nexxus-app`) y acepta los términos. (Puedes desactivar Google Analytics por ahora si no lo necesitas).
3. Una vez creado el proyecto, habilita los siguientes 3 servicios fundamentales:

### A. Authentication (Autenticación)
- En el menú lateral izquierdo, ve a **Build > Authentication**.
- Haz clic en **Comenzar**.
- Selecciona la pestaña **Sign-in method** (Método de inicio de sesión) y habilita **Correo electrónico/Contraseña**.
- Guarda los cambios.

### B. Firestore Database (Base de Datos)
- Ve a **Build > Firestore Database**.
- Haz clic en **Crear base de datos**.
- Selecciona tu ubicación (ej. `us-central1`).
- Iníciala en **Modo Producción** (nuestras reglas de seguridad protegerán los datos).

### C. Cloudinary (Imágenes)
- Las fotos y logotipos se suben con Cloudinary desde `app/src/infrastructure/storage/cloudinaryStorage.ts`.
- No crees bucket de archivos en Firebase para este proyecto.

---

## 3. Generación y Configuración de Credenciales (API Keys)

Para que tu código se comunique con Firebase, necesitas las llaves de configuración.

1. En la consola de Firebase, ve a la tuerca ⚙️ **Configuración del proyecto > General**.
2. Baja hasta "Tus apps" y haz clic en el icono **</>** (Web) para registrar una nueva aplicación web (llámala "Nexxus Admin Panel").
3. Copia el objeto `firebaseConfig` que te aparecerá. Se verá algo así:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXX...",
     authDomain: "nexxus-app.firebaseapp.com",
     projectId: "nexxus-app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

**Acciones en tu código:**
Debes pegar ese bloque exacto reemplazando los `"..."` en los siguientes 5 archivos de tu proyecto:
1. `/src/firebase/config.js` (App Móvil React Native)
2. `/admin/js/auth.js` (Panel Admin Web)
3. `/admin/js/common.js` (Panel Admin Web)
4. `/admin/js/dashboard.js` (Panel Admin Web)
5. `/admin/js/equipo.js` (Panel Admin Web)

---

## 4. Despliegue del Backend (Reglas y Cloud Functions)

Ahora vamos a subir la lógica segura que creamos a los servidores de Google.

1. Abre una terminal y colócate en la raíz del proyecto (`nexxus`):
   ```bash
   cd nexxus
   ```
2. Inicializa el enlace de tu proyecto local con el proyecto en la nube:
   ```bash
   firebase use --add
   ```
   *(Selecciona el proyecto que acabas de crear).*
3. Instala las dependencias del servidor (Cloud Functions):
   ```bash
   cd functions
   npm install
   cd ..
   ```
4. Despliega todas las configuraciones con este comando mágico:
   ```bash
   firebase deploy
   ```
   *(Esto subirá el archivo `firestore.rules` y las funciones Node.js a la nube).*

> **Nota:** Desplegar Cloud Functions (Node.js 18+) requiere estar en el plan tarifario **Blaze** (pago por uso) de Firebase. Sin embargo, no se cobra nada si no superas la capa gratuita de 2 millones de invocaciones al mes.

---

## 5. El "Paso Cero": Crear el Primer Administrador

Dado que hemos bloqueado el registro público por seguridad (y las funciones de crear usuario exigen ser un admin para ejecutarse), necesitas crear al *Super Administrador* manualmente por primera vez.

1. En la consola de Firebase, ve a **Authentication > Usuarios**.
2. Haz clic en **Agregar usuario** y crea el usuario principal de tu empresa (ej. `admin@nexxus.com` con una contraseña segura).
3. **Copia el UID** (ID de usuario) de esa cuenta recién generada.
4. Ahora ve a **Firestore Database**.
5. Haz clic en **Empezar colección**, ponle de nombre `usuarios`.
6. En **ID del documento**, *pega el UID* que acabas de copiar.
7. Añade los siguientes campos exactamente con este nombre y tipo:
   - `id` (string) : (Pega el UID de nuevo)
   - `nombre` (string) : "Tu Nombre / Empresa"
   - `correo` (string) : "admin@nexxus.com"
   - `rol` (string) : "admin"
   - `estado_activo` (boolean) : true

¡Listo! A partir de ahora, este administrador puede iniciar sesión en la web y crear al resto de los empleados/jefes desde la interfaz visual sin tener que volver a entrar a la consola.

---

## 6. ¡Todo Listo!
Ya puedes encender todo tu ecosistema.
- Para el panel web: Puedes levantar el portal con un Live Server abriendo `/admin/html/login.html`.
- Para la app móvil: Levanta el servidor de React Native/Expo:
  ```bash
  npx expo start
  ```

¡A disfrutar de Nexxus!
