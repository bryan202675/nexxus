# Guía de Migración de Backend de Firebase a una Nueva Cuenta

Esta guía detalla paso a paso el procedimiento para migrar la infraestructura del backend de Nexxus (actualmente en el proyecto `nexxus-5f119`) a un nuevo proyecto de Firebase bajo una cuenta de Google diferente.

---

## Tabla de Contenidos
1. [Paso 1: Configurar el Nuevo Proyecto en la Consola de Firebase](#paso-1-configurar-el-nuevo-proyecto-en-la-consola-de-firebase)
2. [Paso 2: Exportar y Migrar Datos del Proyecto Anterior (Opcional)](#paso-2-exportar-y-migrar-datos-del-proyecto-anterior-opcional)
3. [Paso 3: Configurar e Iniciar Sesión en Firebase CLI en tu Terminal](#paso-3-configurar-e-iniciar-sesión-en-firebase-cli-en-tu-terminal)
4. [Paso 4: Vincular el Código Local al Nuevo Proyecto](#paso-4-vincular-el-código-local-al-nuevo-proyecto)
5. [Paso 5: Actualizar las Credenciales en la Aplicación Cliente (`firebaseConfig.ts`)](#paso-5-actualizar-las-credenciales-en-la-aplicación-cliente-firebaseconfigts)
6. [Paso 6: Desplegar Reglas, Índices y Cloud Functions al Nuevo Proyecto](#paso-6-desplegar-reglas-índices-y-cloud-functions-al-nuevo-proyecto)
7. [Paso 7: Crear el Primer Administrador en la Nueva Base de Datos](#paso-7-crear-el-primer-administrador-en-la-nueva-base-de-datos)

---

## Paso 1: Configurar el Nuevo Proyecto en la Consola de Firebase

1. **Crear el Proyecto**:
   - Inicia sesión en la [Consola de Firebase](https://console.firebase.google.com/) con la **nueva cuenta de Google**.
   - Haz clic en **Agregar proyecto** (Add project).
   - Asigna un nombre descriptivo al proyecto (por ejemplo, `nexxus-new` o el que decidas) y acepta los términos. Puedes activar o desactivar Google Analytics según tus necesidades.
   
2. **Cambiar al Plan Blaze (Pago por uso)**:
   > [!IMPORTANT]
   > Para poder desplegar y ejecutar **Cloud Functions** (Node.js 18+), Firebase requiere que la cuenta esté en el plan tarifario **Blaze**.
   - En la esquina inferior izquierda de la consola de Firebase, haz clic en **Actualizar** (Upgrade) al lado del plan Spark.
   - Selecciona el plan **Blaze** y vincula un método de pago.
   - *Nota:* Firebase ofrece una amplia capa gratuita mensual (por ejemplo, 2 millones de ejecuciones de funciones gratis al mes), por lo que no se generarán cobros a menos que excedas dicho límite.

3. **Habilitar los Servicios Clave**:
   - **Authentication**:
     - Dirígete a **Build > Authentication** y haz clic en **Comenzar**.
     - En la pestaña **Sign-in method**, habilita el proveedor de **Correo electrónico/Contraseña** (Email/Password) y guarda los cambios.
   - **Firestore Database**:
     - Ve a **Build > Firestore Database** y haz clic en **Crear base de datos**.
     - Selecciona la ubicación física de tu base de datos (por ejemplo, `us-central1` o la más cercana a tu región).
     - Selecciónala en **Modo de producción** (nuestras reglas locales sobrescribirán este modo al hacer deploy).
   - **Cloudinary**:
     - Configura el cloud `drsygtiob` y el upload preset `nexxus-app` para imagenes.
   - **Hosting**:
     - Ve a **Build > Hosting** y haz clic en **Comenzar** para inicializar el servicio de Hosting en la nube.

---

## Paso 2: Exportar y Migrar Datos del Proyecto Anterior (Opcional)

Si el proyecto anterior ya contiene usuarios registrados e información en la base de datos que deseas conservar, puedes migrar estos datos de la siguiente manera:

### A. Migrar Usuarios (Authentication)
1. **Exportar usuarios del proyecto antiguo**:
   Desde tu terminal (estando logueado en la cuenta anterior):
   ```bash
   firebase auth:export usuarios_respaldo.json --project nexxus-5f119
   ```
2. **Importar usuarios en el nuevo proyecto**:
   Una vez configurada la sesión en la nueva cuenta (Paso 3), ejecuta:
   ```bash
   firebase auth:import usuarios_respaldo.json --hash-algo SCRYPT --rounds 8 --mem-cost 14 --project TU_NUEVO_PROJECT_ID
   ```

### B. Migrar Documentos (Firestore)
Para bases de datos pequeñas de desarrollo, puedes ingresar los registros manualmente o utilizar herramientas de terceros. Si necesitas la exportación oficial mediante Google Cloud CLI (`gcloud`):
1. Prepara un destino temporal de exportacion en Google Cloud para tu proyecto anterior.
2. Exporta Firestore al destino temporal:
   ```bash
   gcloud firestore export gs://NOMBRE_BUCKET_TEMPORAL --project nexxus-5f119
   ```
3. Transfiere/copia la exportacion al destino temporal de la nueva cuenta.
4. Importa Firestore en la nueva base de datos:
   ```bash
   gcloud firestore import gs://NOMBRE_NUEVO_BUCKET/nombre-de-la-carpeta-exportada --project TU_NUEVO_PROJECT_ID
   ```

---

## Paso 3: Configurar e Iniciar Sesión en Firebase CLI en tu Terminal

1. **Cerrar sesión** de la cuenta antigua en tu computadora:
   ```bash
   firebase logout
   ```
2. **Iniciar sesión** con la nueva cuenta de Google:
   ```bash
   firebase login
   ```
   *Esto abrirá una pestaña en tu navegador web. Selecciona la nueva cuenta de Google y otorga los permisos necesarios.*
3. **Validar proyectos asociados**:
   ```bash
   firebase projects:list
   ```
   *Verifica que tu nuevo proyecto aparezca en la lista devuelta por la terminal.*

---

## Paso 4: Vincular el Código Local al Nuevo Proyecto

El archivo `.firebaserc` en la raíz del proyecto es el encargado de dirigir los comandos del CLI de Firebase hacia el proyecto en la nube correcto.

1. Abre el archivo [`.firebaserc`](file:///Users/bryan/Desktop/nexxus1.1/nexxus/.firebaserc).
2. Reemplaza el ID de proyecto actual (`nexxus-5f119`) por el **nuevo Project ID**:
   ```json
   {
     "projects": {
       "default": "TU-NUEVO-PROJECT-ID"
     }
   }
   ```
   *Alternativamente*, puedes ejecutar el siguiente comando desde la raíz `nexxus` de tu terminal para agregarlo:
   ```bash
   firebase use --add
   ```
   *(Selecciona el nuevo proyecto de la lista interactiva y asígnale el alias `default`)*.

---

## Paso 5: Actualizar las Credenciales en la Aplicación Cliente (`firebaseConfig.ts`)

Para que la aplicación React Native y la versión Web puedan conectarse a tu nueva base de datos, debes actualizar el objeto de configuración.

1. En la consola del nuevo proyecto de Firebase, ve a la tuerca ⚙️ **Configuración del proyecto > General**.
2. En la sección inferior **Tus apps**, haz clic en **Agregar app** y selecciona el icono de web **</>**.
3. Registra tu app (por ejemplo, `Nexxus Client`) y copia el objeto `firebaseConfig` generado.
4. Abre el archivo del proyecto local: [`firebaseConfig.ts`](file:///Users/bryan/Desktop/nexxus1.1/nexxus/app/src/infrastructure/firebase/firebaseConfig.ts).
5. Localiza la constante `firebaseConfig` (líneas 25 a 33) y reemplaza sus propiedades con las nuevas credenciales:
   ```typescript
   const firebaseConfig = {
     apiKey: "TU_NUEVA_API_KEY",
     authDomain: "TU_NUEVO_PROYECTO_ID.firebaseapp.com",
     projectId: "TU_NUEVO_PROYECTO_ID",
     messagingSenderId: "TU_NUEVO_MESSAGING_SENDER_ID",
     appId: "TU_NUEVA_APP_ID",
     measurementId: "TU_NUEVO_MEASUREMENT_ID"
   };
   ```

---

## Paso 6: Desplegar Reglas, Índices y Cloud Functions al Nuevo Proyecto

Una vez configurado y enlazado el CLI y las credenciales, procedemos a realizar el despliegue de toda la infraestructura.

1. Asegúrate de estar en el directorio raíz de Firebase (`nexxus`):
   ```bash
   cd /Users/bryan/Desktop/nexxus1.1/nexxus
   ```
2. Instala/actualiza las dependencias necesarias de las Cloud Functions dentro de la carpeta `backend`:
   ```bash
   cd backend
   npm install
   cd ..
   ```
3. Ejecuta el comando de despliegue general:
   ```bash
   firebase deploy
   ```
   *Este comando compilará y subirá:*
   - **Reglas de Firestore** (`firestore.rules`)
   - **Índices de Firestore** (`firestore.indexes.json`)
   - **Cloud Functions** (código Node.js en `/backend`)
   - **Hosting** (si aplica)

---

## Paso 7: Crear el Primer Administrador en la Nueva Base de Datos

Las reglas de seguridad de Firestore (`firestore.rules`) impiden que cualquier usuario cree registros en la colección `usuarios` sin ser previamente un administrador. Por ello, debes crear el primer super-usuario de forma manual:

1. En la consola de Firebase del nuevo proyecto, ve a **Authentication > Usuarios** y haz clic en **Agregar usuario**.
2. Crea el correo del administrador principal (ej. `admin@nexxus.com`) y define una contraseña segura.
3. Una vez creado, **copia el UID** (ID de usuario) de ese registro.
4. Ve a **Firestore Database** e inicia una nueva colección con el nombre **`usuarios`**.
5. En **ID del documento**, pega el **UID** del usuario que copiaste anteriormente (esto es sumamente importante para vincular Auth con Firestore).
6. Agrega los siguientes campos obligatorios respetando los nombres y tipos de datos:
   - `id` (tipo string): *Pega el UID de nuevo*
   - `nombre` (tipo string): *Nombre de la empresa o del administrador principal*
   - `correo` (tipo string): `admin@nexxus.com`
   - `rol` (tipo string): `admin`
   - `estado_activo` (tipo boolean): `true`

---

¡Felicidades! Siguiendo estos pasos, tu backend estará migrado con éxito y todo el ecosistema estará listo para conectarse al nuevo proyecto de Firebase.
