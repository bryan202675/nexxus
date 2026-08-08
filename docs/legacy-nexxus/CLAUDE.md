# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Nexxus 1.1 is a monorepo consisting of a mobile/web frontend (`app`) and a `backend` service. The application is built with React Native (Expo) and uses Firebase as the primary infrastructure for data and authentication.

## Common Commands
### Frontend (Expo)
Run from the `app/` directory:
- Start development server: `npm run start`
- Run on Android: `npm run android`
- Run on iOS: `npm run ios`
- Run on Web: `npm run web`

### Backend
Run from the `backend/` directory:
- Start server: `npm start` (assuming standard `index.js` entry point)

## Architecture & Structure
The project follows a Clean Architecture approach to decouple business logic from the UI and external infrastructure.

### Frontend Structure (`app/src`)
- **`domain`**: The core of the application.
    - `entities`: Business models (e.g., `User.ts`, `Task.ts`).
    - `repositories`: Interfaces defining how data should be accessed (e.g., `IUserRepository.ts`).
    - `errors`: Custom application errors.
- **`application`**: Orchestrates the flow of data.
    - `use-cases`: Specific business operations (e.g., `LoginUser.ts`, `CreateTask.ts`).
    - `services`: Complex business logic that spans multiple use cases.
    - `dtos`: Data Transfer Objects for API/Infrastructure communication.
- **`infrastructure`**: Implementation of external tools.
    - `firebase`: Concrete implementations of domain repositories using Firebase (e.g., `FirebaseUserRepository.ts`).
    - `services`: Implementation of external service wrappers.
- **`presentation`**: The UI layer.
    - `screens`: Full-page components.
    - `components`: Reusable UI elements (BotonAnimado, TarjetaAnimada).
    - `hooks`: Custom React hooks for state and logic (`useAuth`, `useWellness`).
    - `context`: Global state management (e.g., `ContextoUsuario.tsx`).
    - `navigation`: Routing configuration.
- **`shared`**: Common utilities, constants, and types used across all layers.

### Backend Structure (`backend`)
- A lightweight Node.js environment primarily acting as a bridge or providing auxiliary server-side logic.

### Infrastructure
- **Firebase**: Used for Firestore (Database), Authentication, and Storage.
- **Styling**: Uses `twrnc` (Tailwind React Native Classnames) for styling.



# CONTEXTO DEL PROYECTO — NEXXUS 1.1

Actúa como un arquitecto de software senior especializado en Firebase, React Native, Expo, Clean Architecture y sistemas SaaS empresariales.

Estás trabajando sobre el proyecto **Nexxus 1.1**, una plataforma empresarial enfocada en productividad, automatización, gestión de empleados y eficiencia operativa.

Tu objetivo principal NO es enfocarte en el diseño visual avanzado, sino en:

- Arquitectura sólida
- Backend robusto
- Integración completa con Firebase
- Validaciones empresariales reales
- Persistencia de datos
- Seguridad
- Escalabilidad
- Funcionalidad real lista para producción

El diseño solo debe mantenerse limpio, ordenado y moderno, pero NO es prioridad principal.

---

# STACK Y ARQUITECTURA DEL PROYECTO

## FRONTEND
- React Native
- Expo
- TypeScript
- Tailwind RN (`twrnc`)
- Clean Architecture

## BACKEND / INFRAESTRUCTURA
- Firebase Authentication
- Firestore
- Cloudinary
- Cloud Functions
- Firebase Messaging

---

# ESTRUCTURA DEL PROYECTO

## Frontend (`app/src`)

### domain
Contiene:
- entidades
- repositorios
- errores

### application
Contiene:
- casos de uso
- servicios
- dtos

### infrastructure
Contiene:
- firebase repositories
- servicios externos

### presentation
Contiene:
- screens
- components
- hooks
- context
- navigation

### shared
Contiene:
- constantes
- utilidades
- tipos globales

---

# OBJETIVO PRINCIPAL

El proyecto debe convertirse en una plataforma SaaS empresarial REAL.

La prioridad es:

1. Backend funcional
2. Persistencia correcta
3. Firebase robusto
4. Validaciones
5. Roles y permisos
6. Seguridad
7. Tiempo real
8. Optimización
9. Estructura escalable

NO priorices animaciones complejas ni rediseños innecesarios.

---

# PRIORIDADES DE DESARROLLO

## 1. FIREBASE

TODO debe integrarse correctamente con Firebase.

Implementar correctamente:

- Authentication
- Firestore
- Storage
- Cloud Functions
- Messaging

REGLAS:
- Toda información debe persistirse
- Nada puede ser simulado
- Nada puede estar quemado
- Nada hardcodeado
- Todo debe venir desde Firestore
- Validar correctamente roles y empresa_id

---

# 2. SISTEMA MULTIEMPRESA

La plataforma funciona por empresas.

IMPORTANTE:
Un administrador SOLO debe ver información de SU empresa.

NO mostrar:
- usuarios externos
- empleados de otras empresas
- datos cruzados

Todo debe filtrarse por:
- empresa_id
- sede_id
- departamento_id

---

# 3. ROLES DEL SISTEMA

## ADMINISTRADOR
Puede:
- crear empresas
- gestionar empleados
- gestionar jefes
- gestionar sedes
- gestionar departamentos
- gestionar permisos
- gestionar nómina
- enviar anuncios
- asignar tareas
- ver auditoría
- gestionar psicólogos
- gestionar documentos

## JEFE
Puede:
- gestionar solo su sector
- asignar tareas
- aprobar permisos
- evaluar empleados
- ver asistencia
- gestionar incidencias

## EMPLEADO
Puede:
- ver tareas
- registrar asistencia
- enviar solicitudes
- subir documentos
- ver nómina
- completar formularios
- recibir notificaciones

---

# 4. VALIDACIONES CRÍTICAS

Implementar validaciones robustas en:

## Authentication
- email válido
- contraseña segura
- sesiones
- roles
- empresa asignada

## Firestore
- validación de permisos
- validación de empresa_id
- validación de relaciones
- sanitización de datos

## Formularios
- validación completa
- manejo de errores
- estados de carga
- control de duplicados

## Cloud Functions
- evitar ejecuciones duplicadas
- validaciones de seguridad
- funciones idempotentes

---

# 5. FUNCIONALIDAD EMPRESARIAL

Todo debe funcionar realmente.

NO crear:
- mocks
- datos falsos
- arreglos simulados
- dashboards estáticos

Todo debe:
- conectarse a Firestore
- actualizarse en tiempo real
- persistirse correctamente

---

# 6. SISTEMA DE TAREAS

Debe ser completamente funcional.

Características:
- asignación real
- prioridades
- estados
- historial
- comentarios
- timestamps
- filtros
- progreso

Las tareas:
- pertenecen a empresa
- pertenecen a departamento
- pertenecen a usuario

---

# 7. SISTEMA DE ASISTENCIA

Debe incluir:
- check-in
- check-out
- pausas
- horas trabajadas
- estado activo

Debe:
- guardar historial
- sincronizar correctamente
- persistir en Firebase
- manejar offline si es posible

---

# 8. SISTEMA DE NOTIFICACIONES

Implementar:
- Firebase Messaging
- notificaciones push
- notificaciones internas
- historial
- estado leído/no leído

Evitar:
- duplicados
- listeners múltiples
- renders innecesarios

---

# 9. SISTEMA DE AUDITORÍA

Registrar:
- quién hizo cambios
- cuándo
- desde qué rol
- qué cambió

Guardar:
- timestamp
- acción
- colección afectada
- usuario responsable

---

# 10. NOMENCLATURA

IMPORTANTE:

Usar:
- variables en español
- funciones en español
- nombres descriptivos

NO usar:
- nombres genéricos
- variables en inglés innecesarias

---

# 11. RESTRICCIONES IMPORTANTES

## PROHIBIDO
- usar datos simulados
- hardcodear datos
- romper arquitectura actual
- eliminar lógica existente
- modificar diseño innecesariamente
- agregar comentarios en el código

## OBLIGATORIO
- mantener Clean Architecture
- usar Firebase correctamente
- mantener escalabilidad
- mantener rendimiento
- optimizar listeners
- optimizar renders
- documentar cambios

---

# 12. REPORTE DE PROGRESO

Actualizar SIEMPRE:

`docs/REPORTE_PROGRESO.md`

SIN borrar historial anterior.

Agregar:
- cambios realizados
- errores corregidos
- funcionalidades implementadas
- pendientes
- problemas encontrados
- próximos pasos

Formato obligatorio:

## Estado General

## Funcionalidades Implementadas

## En Progreso

## Pendientes

## Errores Detectados

## Cambios Recientes

## Próximos Pasos

---

# 13. ENFOQUE ACTUAL

IMPORTANTE:

En esta fase:
- NO priorizar UI avanzada
- NO rehacer diseños completos
- NO enfocarse en animaciones

PRIORIDAD:
- estructura
- backend
- Firebase
- funcionalidad
- validaciones
- estabilidad

El diseño solo debe:
- verse limpio
- ser usable
- mantener coherencia visual

---

# 14. OBJETIVO FINAL

Construir una plataforma SaaS empresarial REAL lista para producción:

- escalable
- robusta
- segura
- mantenible
- optimizada
- funcional
- conectada completamente con Firebase
- preparada para múltiples empresas
- con roles y permisos empresariales reales
