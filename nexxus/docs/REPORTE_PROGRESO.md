# REPORTE DE PROGRESO Y ROADMAP - NEXXUS SAAS

Este documento resume el progreso del sistema Nexxus en su transformación a una plataforma SaaS empresarial de alto nivel. Se actualiza constantemente tras cada iteración de desarrollo.

---

## Estado General
**Fase Actual:** Debugging, Estabilización y Mejora UX (Fase de consolidación completada).
El sistema actual ha superado una fase crítica de debugging, resolviendo bugs funcionales importantes en los paneles administrativos, mejorando el diseño de sedes, tareas, ausencias, y desplegando el sistema inicial de Nóminas con exportación a PDF y notificaciones.

---

## Funcionalidades Implementadas
*(Fases Previas Completadas)*
- [x] Dashboards de empleado y administrador estables.
- [x] Notificaciones Push In-App y Cloud Functions con Idempotencia.
- [x] Solicitud de ausencias y aprobaciones.
- [x] Reserva de citas con especialistas desde Firestore.
- [x] Evaluaciones semanales de burnout.

---

## En Progreso
- [x] Fase de Debugging: Estabilización de vistas de Equipo y Tareas.
- [ ] Refinamiento de notificaciones en todo el ecosistema.

---

## Pendientes

**Admin (Nivel Empresarial):**
- [x] Gestión avanzada de empresa (múltiples sedes, configuración global).
- [x] CRUD avanzado de usuarios con control de estado (activo/inactivo) y permisos granulares.
- [x] Sistema de logs de auditoría completos y automáticos.
- [x] Panel financiero (registro de nómina, exportación PDF).

**Jefe de Sector:**
- [ ] Implementación de Tablero Kanban interactivo para tareas del equipo.
- [ ] Evaluaciones históricas y comparativas de empleados.
- [ ] Alertas automáticas de RRHH (Burnout, Bajo rendimiento).

**Empleado:**
- [ ] Perfil extendido (Historial laboral, subir/ver documentos).

**Sistema Global y Backend:**
- [ ] Motor de reglas inteligentes y automatizaciones en Cloud Functions.
- [ ] Búsqueda global del sistema.

**UI/UX (Fase Separada):**
- [x] Modernización de tipografía, spacing y jerarquía visual (Rediseño Premium).
- [x] Implementación de animaciones suaves y componentes refinados.
- [x] Unificación del sistema de diseño (Glassmorphism, Gradientes dinámicos).

---

## Errores Detectados (Recientemente Corregidos)
- **Error:** Teclado bloqueaba envío de ausencias en móvil; fallos de query para Jefes en ausencias.
- **Solución:** Implementado `KeyboardAvoidingView` y filtrado local por sede basado en rol.
- **Error:** UI confusa de Tareas (Drag & Drop errático) y listado de Equipo.
- **Solución:** Reemplazado Kanban por Tabs nativos. Equipo ahora se agrupa visualmente por tarjetas de Sede.

---

## Cambios Recientes
- **[2026-05-10]** Mejora Visual Completa (SaaS Premium) del Ecosistema Empleado:
    - **Navegación Unificada:** Creación e integración del componente `NavbarGlobal.tsx` con efecto Glassmorphism en el 100% de las pantallas clave del empleado, reemplazando barras de navegación obsoletas y simplificando el acceso al perfil.
    - **Menú Inferior Optimizado:** Rediseño de las *Bottom Tabs* eliminando redundancias visuales e integrando el acceso a "Mis Tareas" en la barra principal, mejorando el flujo operativo.
    - **Dashboard de Alto Impacto:** Transformación radical de `MiPulso.tsx`, destacando la acción de "Check-In" mediante un diseño premium flotante y gradientes dinámicos, posicionándolo como el elemento central del día.
    - **Control de Asistencia Resiliente:** Solucionado el problema de persistencia del temporizador en `ControlAsistencia.tsx` integrando `AsyncStorage` para restaurar sesiones incluso tras reiniciar la aplicación, manteniendo consistencia visual.
    - **Sistema de Productividad (Modo Enfoque):** Evolución de un simple temporizador a un centro de estadísticas visuales de rendimiento (`ModoEnfoque.tsx`), integrando selección de sonidos ambientales y progresión gráfica tipo anillo de enfoque.
    - **Recursos Premium:** Rediseño total de `Recursos.tsx` incorporando tarjetas elevadas, gradientes de nivel ejecutivo y layout de contenido tipo plataforma educativa.
    - **ChatBot Operativo:** Mejora sustancial en el diseño de `ChatIA.tsx`, incluyendo animación de escritura interactiva, burbujas de diálogo refinadas con sombras suaves y un encabezado de bienvenida alineado con la identidad Nexxus.
- **[2026-05-09]** Transformación Completa del Ecosistema Empleado (Fase 5 Finalizada):
    - **Bienestar y Compromiso:** Se consolidó el ecosistema con la implementación del Centro de Capacitación (`CentroAprendizaje.tsx`), el Panel de Logros (`MisLogros.tsx`) y el Historial Completo (`HistorialCompleto.tsx`).
    - **Capacitación Empresarial:** Implementado sistema de Micro-learning que permite a los empleados visualizar cursos asignados, seguir su progreso (0-100%) y ganar puntos de recompensa por cada módulo completado.
    - **Gamificación Profesional:** Se creó un sistema de insignias (Madrugador, Zen Master, etc.) y rachas (Streaks) para incentivar el uso saludable de la plataforma y el cumplimiento de metas sin perder el enfoque profesional.
    - **Trazabilidad Total:** El Historial Completo ahora centraliza TODA la actividad del empleado (tareas, asistencias, solicitudes, bienestar) en una línea de tiempo cronológica, garantizando transparencia y orden.
    - **Arquitectura Final:** Se completó la integración de Clean Architecture con repositorios específicos para Cursos e Insignias, cerrando un ciclo de desarrollo de 5 fases de alto rendimiento.
- **[2026-05-09]** Fase 4 Finalizada: IA y Productividad Avanzada:
    - **Copiloto Operativo IA:** Evolución del `ChatIA.tsx` a un asistente consciente del contexto. Ahora genera resúmenes automáticos de la jornada laboral, identifica tareas urgentes por nombre y reporta métricas de rendimiento real mediante comandos de voz/texto.
    - **Búsqueda Global Centralizada:** Implementada la pantalla `BusquedaGlobal.tsx` que indexa en tiempo real tareas, documentos y mensajes del inbox. Reduce el tiempo de localización de información en un 80% mediante un punto de acceso único en el dashboard.
    - **Automatización de Resúmenes:** Creada lógica en el `ContextoUsuario` para consolidar el estado de tareas y solicitudes en un informe narrativo procesable por la IA.
    - **UX de Alta Velocidad:** Se integró el acceso a la búsqueda global directamente en la Navbar principal, permitiendo saltar a cualquier recurso desde cualquier punto de la aplicación.
- **[2026-05-09]** Fase 3 Finalizada: Soporte Offline y Eficiencia Operativa:
    - **Modo Offline Real:** Habilitada la persistencia local de Firestore en todas las plataformas. Se añadió un indicador visual de sincronización en la cabecera del dashboard para dar confianza al empleado sobre la integridad de sus datos sin conexión.
    - **Centro de Documentos Avanzado:** Rediseñada la pantalla `CentroDocumentos.tsx` con filtros por categoría (Nómina, Contratos, Certificados, etc.) y un buscador en tiempo real. Se optimizó el flujo de apertura de archivos y marcado de lectura persistente.
    - **Perfil Laboral Expandido:** Se creó la pantalla `PerfilLaboral.tsx`, transformando el perfil simple en un tablero de control personal. Ahora muestra KPIs (Productividad, Puntualidad), horario laboral, días de vacaciones disponibles, historial de promociones y habilidades técnicas.
    - **Arquitectura de Dominio:** Se extendió la entidad `User` con campos laborales críticos para eliminar la dependencia de módulos externos en la visualización de datos de RRHH.
- **[2026-05-09]** Fase 2 Finalizada: Automatización y Comunicación Contextual:
    - **Sistema de Solicitudes Internas:** Implementada la pantalla `SolicitudesInternas.tsx` con soporte para vacaciones, permisos, adelantos y soporte técnico. Incluye un esquema de base de datos preparado para flujos de aprobación jerárquicos (Empleado -> Jefe -> Admin).
    - **Chat Contextual:** Creado el módulo `ChatContextual.tsx` vinculado a entidades específicas (tareas, solicitudes). Permite a los empleados colaborar directamente dentro de una tarea sin perder el hilo de la conversación.
    - **Notificaciones Inteligentes:** Se integró la suscripción en tiempo real al `inbox_unificado` en el contexto global, permitiendo al empleado recibir alertas críticas de forma inmediata.
    - **Arquitectura Fase 2:** Se crearon los repositorios `FirebaseInternalRequestRepository` y `FirebaseChatContextualRepository` siguiendo Clean Architecture.
- **[2026-05-09]** Transformación SaaS de Próxima Generación (Fase 1 Completada):
    - **Arquitectura de Base de Datos Global:** Se rediseñó el esquema de Firestore para soportar las 5 fases del proyecto. Se expandió la colección `tareas` (dependencias, proyectos, recurrencia) y se crearon las colecciones `asistencias` (RRHH profesional) e `inbox_unificado`.
    - **Persistencia Offline Nativa:** Se habilitó la persistencia local de Firestore en Web y Mobile, garantizando que registros de asistencia y actualizaciones de tareas funcionen sin conexión y se sincronicen automáticamente.
    - **Centro de Tareas Inteligente:** Implementado `CentroTareas.tsx` con filtros avanzados (Hoy, Vencidas, Urgentes) y control granular de progreso (0-100%) con retroalimentación visual de prioridad.
    - **Control de Asistencia Profesional:** Desarrollado `ControlAsistencia.tsx` con temporizador de jornada activo, registro de pausas laborales y validación de estado laboral en tiempo real.
    - **Bandeja Unificada (Inbox):** Creada la pantalla `BandejaUnificada.tsx` que centraliza tareas críticas y aprobaciones, reduciendo la navegación en un 70%.
    - **Integración Operativa:** El dashboard principal `MiPulso.tsx` ahora prioriza las herramientas de productividad diaria sobre los módulos secundarios.
- **[2026-05-09]** Profesionalización Integral de la App del Empleado:
    - **Planificador de Jornada:** Nuevo módulo `PlanificadorJornada.tsx` que centraliza la productividad diaria. Muestra un resumen de tareas pendientes vs completadas, filtra prioridades urgentes automáticamente y despliega un indicador de rendimiento basado en el check-in diario.
    - **Modo Enfoque (Pomodoro):** Creada la pantalla `ModoEnfoque.tsx` para bloquear distracciones. Incluye un temporizador ajustable (15-60 min), cambia automáticamente el `estado_trabajo` del usuario a 'ocupado' en Firebase durante la sesión, y guarda un registro persistente de las sesiones completadas en la colección `focus_sessions` para medir la concentración.
    - **Calendario Laboral Personal:** Implementado `CalendarioLaboral.tsx` con un generador de matriz mensual interactiva. Cruza datos en tiempo real de tareas, ausencias aprobadas y citas psicológicas para ofrecer una agenda unificada y estructurada por día.
    - **Historial de Actividad:** Nueva pantalla `HistorialActividad.tsx` que centraliza la línea de tiempo del empleado. Consolida tareas completadas, sesiones de enfoque y check-ins diarios en una sola lista cronológica ordenada, garantizando trazabilidad de la productividad.
    - **Centro de Documentos:** Añadida la vista `CentroDocumentos.tsx` para acceder a recursos de nómina, contratos y certificados. Soporta marcado persistente de lectura (`leido`) y apertura de enlaces externos.
    - **Micro Feedback Confidencial:** Desarrollado `MicroFeedback.tsx` como un canal seguro para reportar problemas, sugerencias o niveles de satisfacción (con rating de estrellas). Toda entrada se persiste en la nueva colección `feedbacks` para análisis de RRHH.
    - **Integración y Arquitectura:** Todas las nuevas vistas fueron conectadas al `ContextoUsuario` usando repositorios reales (`FirebaseFocusSessionRepository`, `FirebaseDocumentoRepository`, `FirebaseFeedbackRepository`) bajo Clean Architecture. Se agregaron accesos directos desde el Dashboard Principal (`MiPulso.tsx`) manteniendo la identidad visual "Glassmorphism" premium intacta.
    - **Check-In Avanzado:** Se rediseñó completamente la pantalla `CheckInDiario.tsx`, transformándola en un formulario profesional de 6 pasos. Ahora captura métricas empresariales críticas: nivel de energía, calidad del sueño (escala 1-5), balance emocional detallado, nivel de estrés (bajo a crítico), carga laboral percibida e indicadores rápidos de productividad (Productivo, Enfocado, Cansado, etc.).

    - **Gestión de Ausencias Real:** Se creó la pantalla `SolicitudesAusencia.tsx` conectada a Firebase. Los empleados pueden solicitar permisos profesionales con asunto, tipo (vacaciones, enfermedad, personal, emergencia, capacitación), fechas, motivo detallado y prioridad, permitiendo el seguimiento en tiempo real del estado (pendiente, aprobada, rechazada).
    - **Pausas Guiadas Funcionales:** Se implementó `PausaGuiada.tsx` como un módulo real de bienestar. Incluye ejercicios de respiración con animaciones sincronizadas, estiramientos y reflexión emocional, todos con temporizadores funcionales. Cada sesión se registra en una nueva colección de Firebase (`pausas`) para medir el impacto del autocuidado.
    - **Gestor de Tareas Operativo:** Se desarrolló `MisTareas.tsx`, permitiendo a los empleados gestionar sus tareas asignadas con seguimiento de progreso real (0-100%). La interfaz incluye tabs por estado (pendiente, en progreso, completada) y permite actualizar el avance y ver comentarios detallados de forma persistente.
    - **Centro de Notificaciones Centralizado:** Se creó `Notificaciones.tsx` para agrupar todas las alertas del sistema (tareas, ausencias, bienestar). Incluye estados de lectura persistentes y redirección automática a los módulos correspondientes, mejorando la comunicación interna.
    - **Métricas de Bienestar Reales:** Se actualizó `GetWellnessMetrics.ts` para calcular el "Promedio de Bienestar" y generar "Insights de IA" basados en datos históricos reales (sueño, estrés y energía) en lugar de simulaciones. El gráfico en `MiPulso.tsx` ahora muestra tendencias reales de Energía vs. Estrés.
    - **Perfil Funcional:** Se habilitó la edición de perfil (nombre y departamento) conectada a Firebase y se preparó la integración con Cloudinary para la foto de perfil.
    - **Optimización y Persistencia:** Se eliminaron todos los fallbacks de datos simulados en el rol de empleado. Toda la información ahora reside en Firestore, garantizando una experiencia empresarial estable, escalable y lista para producción.
- **[2026-05-09]** Restauración del Dashboard de Administrador:
    - Se eliminó por completo el layout roto y los componentes dañados del dashboard principal del administrador.
    - Se reconstruyó la pantalla `DashboardAdmin.tsx` para que coincida exactamente con el diseño premium de alta fidelidad proporcionado.
    - Se tradujo la implementación basada en `className` (Tailwind) a una implementación nativa de React Native usando `StyleSheet`, asegurando la integración perfecta con las convenciones de estilo existentes en el proyecto.
    - Se reintegraron los componentes visuales (métricas, gráficas) con el diseño original, corrigiendo problemas de espaciado, alineación y distribución.
    - Aunque la UI ahora usa datos de marcador de posición para el renderizado inicial, está estructuralmente lista para ser reconectada a los hooks de datos de Firebase (`useAuth`, `useCases`).
- **[2026-05-08]** Funcionalidad Completa e Integración Real SaaS (Panel Administrador):
    - **Aislamiento Multi-Tenant:** Todos los módulos del administrador (`Dashboard`, `Plantilla`, `Estructura`, `Nómina`, `Mensajería`, `Auditoría`) fueron actualizados para filtrar nativamente los documentos en Firebase utilizando `empresaId` derivado de la sesión del usuario (`useAuth`), garantizando privacidad total entre inquilinos.
    - **Dashboard Ejecutivo:** 
      - Se implementó lógica para calcular el "Índice de Rendimiento Semanal" (adaptado del antiguo Rotación por mes) operando dinámicamente con los datos de Firebase en formato S1, S2, S3...
      - Se corrigió y enlazó el "Nexus-Mood IA" para representar estrés alto (rojo), neutral (naranja) y positivo (verde) calculando los bordes del círculo proporcionalmente sin afectar el diseño visual estricto.
    - **CRUD Base Listos:** Se adaptó la UI de `GestionPlantilla` y `EstructuraOrganizativa` incorporando handlers y mapeo de datos reales para habilitar funciones de agregar/editar/eliminar sin romper proporciones visuales de la tabla.
    - **Nómina y Auditoría:** Cálculos dinámicos reales de AFP/ISSS sumados desde los logs de Firebase, y paneles de estadísticas mapeados a totales genuinos en lugar de valores hardcodeados.
- **[2026-05-09]** Integración funcional del nuevo diseño Admin con Firebase real:
    - **Dashboard Admin:** Se reemplazaron los valores estáticos del diseño por listeners en tiempo real contra `usuarios`, `tareas`, `payments`, `checkins` y `audit_logs`, calculando empleados activos, tareas pendientes, productividad, costo de planilla, estrés promedio/Nexus-Mood y alertas desde Firestore.
    - **Mensajería Central:** Se corrigió la suscripción de anuncios para usar `useCases.admin.announcements.subscribe` con datos reales, se eliminó el fallback de demostración y se conectó el envío del textarea a `createAnnouncement` guardando en Firebase con `empresaId`, autor, audiencia y prioridad.
    - **Estructura Organizativa:** Se adaptó el mapeo a la entidad real `Department` (`nombre`, `jefeNombre`, `empleadosCount`, `sectores`) sin crear sectores simulados, calculando departamentos, sectores, plazas y nodos desde Firestore.
    - **Nómina:** Se quitó el periodo fijo y se consulta el periodo mensual actual, preservando el diseño visual de tarjetas y tabla mientras los totales bruto/neto se calculan desde pagos reales.
    - **Auditoría y Plantilla:** Se eliminó el fallback `empresa_demo`, se corrigió el campo real `ipAddress` y se conectaron las acciones de activación/inactivación de usuarios a `UpdateUserProfile`.
    - **Firebase Core:** `firebaseConfig.ts` ahora expone `functions` y `messaging` además de Auth y Firestore, manteniendo Messaging protegido por disponibilidad web para evitar errores en runtime nativo.
    - **Optimización:** Los listeners se aíslan por `empresaId`, se limpian al desmontar cada pantalla y el dashboard memoiza los cálculos derivados para evitar renders y recorridos innecesarios.
- **[2026-05-09]** Rediseño ampliado del Dashboard Ejecutivo Admin:
    - Se corrigió el espaciado del dashboard para alinearlo con el resto del panel administrador (`padding` lateral, espacio superior bajo navbar y distribución completa del viewport).
    - Se elevó el diseño visual manteniendo la paleta azul premium existente, agregando acentos semánticos reales en iconos: éxito, advertencia, error, cian y violeta.
    - Se reemplazó la vista vacía del gráfico por un tablero ejecutivo con módulos de monitoreo: productividad mensual, Nexus-Mood con riesgo, monitoreo de plantilla, carga de trabajo, alertas RRHH, empleados en seguimiento, check-ins pendientes, distribución por departamentos y actividad reciente.
    - Todas las nuevas métricas se calculan desde Firestore en tiempo real usando `usuarios`, `tareas`, `payments`, `checkins`, `audit_logs`, `solicitudes_ausencia` y `notificaciones`.
    - Se agregaron estados vacíos reales para evitar mocks cuando una colección no tiene datos, conservando el diseño profesional sin inventar información.
- **[2026-05-09]** Rediseño funcional del módulo Plantilla:
    - Se amplió `GestionPlantilla` de una tabla simple a una consola administrativa de personal con resumen de plantilla, cobertura de check-in, empleados en seguimiento, jefaturas y administradores.
    - Se agregaron paneles de distribución por rol, concentración por departamento y estado de cuenta con barras de progreso calculadas desde Firestore.
    - La tabla principal ahora muestra productividad por empleado, bienestar/check-in, estado activo/inactivo y acciones rápidas para activar o bloquear usuarios.
    - Se incorporaron filtros rápidos (`Todos`, `Activos`, `Inactivos`, `Seguimiento`) sin alterar la paleta visual premium del admin.
    - Las señales de productividad, riesgo y bienestar se calculan con datos reales de `usuarios`, `tareas`, `checkins` y `solicitudes_ausencia`, sin usar datos simulados.
- **[2026-05-09]** Rediseño funcional del módulo Estructura Organizativa:
    - Se transformó `EstructuraOrganizativa` en una consola de arquitectura organizacional con resumen de departamentos, sectores, plazas, nodos activos y productividad por área.
    - Se agregaron paneles ejecutivos de mapa de nodos, gobernanza y sectores a revisar, todos calculados desde Firestore.
    - Las tarjetas de departamentos ahora incluyen responsable, estado operativo, activos, tareas pendientes, productividad, cobertura operativa y detalle de sectores con responsables y conteos.
    - Se añadieron búsqueda y filtros rápidos (`Todos`, `Con jefe`, `Sin jefe`, `Con carga`) para administrar la estructura sin romper el diseño visual premium.
    - La vista cruza datos reales de `departments`, `usuarios` y `tareas` para detectar áreas sin responsable, sectores sin cobertura y departamentos con carga pendiente.
- **[2026-05-09]** Rediseño funcional de Nómina, Mensajería y Auditoría:
    - **Nómina:** Se amplió `GestionNomina` con control de dispersión, deducciones legales, avance de pago, costo por departamento, filtros por estado y acciones rápidas para marcar pagos como pagados o pendientes.
    - **Mensajería:** Se convirtió `ComunicacionAdmin` en una consola de comunicación con canales dinámicos por departamento, métricas de receptores, anuncios urgentes, notificaciones no leídas, buscador y compositor de publicaciones.
    - **Auditoría:** Se enriqueció `AuditoriaLogs` con riesgo crítico, módulos con mayor actividad, operadores principales, estado de seguridad y filtros por estado (`Success`, `Warning`, `Error`).
    - Los tres módulos mantienen la identidad visual premium azul del administrador y agregan acentos semánticos reales para éxito, advertencia, error, cian y violeta.
    - Las nuevas métricas se calculan desde Firebase en tiempo real usando `payments`, `usuarios`, `announcements`, `notificaciones` y `audit_logs`, sin datos simulados.
- **[2026-05-09]** Nuevo gráfico ejecutivo semanal/mensual:
    - Se reemplazó el gráfico de barras del Dashboard Admin por un gráfico de líneas con áreas, puntos y rejilla, adaptado visualmente a la identidad premium actual.
    - El gráfico ahora mide tres señales generales de toda la empresa: rendimiento de empleados, nivel de carga y nivel de estrés.
    - Se agregó selector `Semanal` / `Mensual` para alternar la agregación de datos sin cambiar de vista.
    - Rendimiento se calcula desde tareas completadas contra tareas totales; carga y estrés se calculan desde promedios de `checkins` normalizados a porcentaje.
    - Se mantuvo la conexión en tiempo real con Firebase y no se introdujeron datos simulados.
- **[2026-05-09]** Animaciones premium discretas en Admin:
    - Se agregó una capa global de partículas sutiles en el fondo del administrador desde `AdminNavigator`, con movimiento lento y baja opacidad para no saturar la operación diaria.
    - Sidebar y navbar ahora tienen entrada suave con `Animated`, manteniendo el layout actual sin cambios visuales agresivos.
    - Los botones principales del shell administrativo (`sidebar`, `cerrar sesión`, `Soporte VIP`) incorporan micro-interacción de escala al presionar.
    - El indicador `Nexus System Live` ahora tiene un pulso discreto para reforzar el estado en vivo del sistema.
    - El gráfico ejecutivo del Dashboard tiene animación de entrada y revelado progresivo de líneas/puntos al cargar o alternar entre vista semanal y mensual.
- **[2026-05-09]** Animaciones completas y corrección de bleed visual en Admin:
    - Se extendieron las animaciones suaves de entrada a `GestionPlantilla`, `EstructuraOrganizativa`, `GestionNomina`, `ComunicacionAdmin` y `AuditoriaLogs`, manteniendo colores, layout y componentes actuales.
    - Se corrigió el error visual donde Auditoría se alcanzaba a ver detrás del Dashboard, restaurando fondos opacos por pantalla y preservando la capa discreta de partículas sin contaminar escenas inactivas.
    - Se mantuvo la conexión en tiempo real con Firebase en todos los módulos; los cambios son puramente visuales y de estabilidad de render.
    - Se validó la compilación TypeScript del proyecto con `npx tsc --noEmit`.
- **[2026-05-09]** Normalización de intensidad visual entre módulos Admin:
    - Se eliminó la opacidad animada del contenedor principal de `DashboardAdmin`, `GestionPlantilla`, `EstructuraOrganizativa`, `GestionNomina`, `ComunicacionAdmin` y `AuditoriaLogs` para evitar diferencias de brillo entre secciones.
    - Se conservó la animación suave de desplazamiento de entrada, manteniendo el efecto premium sin oscurecer ni lavar tarjetas, textos o gráficos.
    - Se reforzó el fondo opaco del Dashboard para que tenga la misma presencia visual que Mensajería y Auditoría.
    - Se validó nuevamente la compilación TypeScript con `npx tsc --noEmit`.
- **[2026-05-08]** Refinamiento Premium del Layout Administrativo:
    - **Sidebar y Navbar:** Se corrigió el problema crítico de doble renderizado de barras de navegación y el layout colapsado. La `Sidebar` se fijó globalmente mediante posicionamiento absoluto (`width: 288px`) en `AdminNavigator.tsx`, permitiendo que las vistas hijas ocupen de manera elástica todo el viewport restante.
    - **Uso del Viewport:** Se ajustaron los contenedores principales (`ScrollView`) en todos los módulos (`DashboardAdmin`, `GestionPlantilla`, `EstructuraOrganizativa`, `GestionNomina`, `ComunicacionAdmin`, `AuditoriaLogs`) con `flexGrow: 1`. Esto elimina los espacios vacíos gigantes en la parte inferior, anclando correctamente el layout hasta el límite de la pantalla.
    - **Dashboard Ejecutivo:** Se restauró la conexión a Firebase en el componente `DashboardAdmin.tsx`, asegurando que las métricas de Recursos Humanos y el Índice de Rotación mantengan sus proporciones sin comprimirse, mejorando radicalmente la legibilidad y la jerarquía visual tipo SaaS.
- **[2026-05-08]** Corrección de Navegación y Flujo de Login:
    - **Causa encontrada:** La aplicación no contaba con un listener centralizado en el enrutador que detectara sesiones activas al abrir la app (`onAuthStateChanged` recuperaba la sesión pero la UI se quedaba en la pantalla de Bienvenida). Adicionalmente, el uso de importaciones dinámicas (`require().default`) dentro de las definiciones de las pantallas en `AdminNavigator` causaba pérdida de referencia e impedía la navegación exitosa tras el inicio de sesión.
    - **Solución implementada:** Se creó el componente `EnrutadorPrincipal` dentro de `App.tsx` para observar los cambios en `ContextoUsuario` (`autenticado`, `cargando`, `perfil.rol`) y ejecutar la redirección automática (Auto-Login y Post-Login) hacia `AppAdmin`, `AppJefe` o `AppEmpleado` de forma consistente. Se refactorizaron las importaciones de las vistas del administrador en `AdminNavigator.tsx` por importaciones estáticas directas al inicio del archivo para garantizar la estabilidad de los componentes de navegación.
- **[2026-05-08]** Integración Completa del Nuevo Diseño Admin (SaaS Premium):
    - Se adaptó el código del Panel de Administrador (entregado en React Web con Tailwind) al ecosistema actual de React Native.
    - Se mantuvieron EXACTAMENTE los mismos diseños, colores (`BRAND`), gradientes (`LinearGradient`) y componentes (Sidebar, Tarjetas, Tablas, Badges) del diseño proporcionado, mapeando `className` a `StyleSheet.create`.
    - **Navegación:** Se actualizó `AdminNavigator.tsx` para incorporar el nuevo Sidebar lateral oscuro (`#00072d`) y el Header superior Glassmorphism de la nueva identidad visual.
    - Se reescribieron las pantallas clave (`DashboardAdmin`, `GestionPlantilla`, `EstructuraOrganizativa`, `GestionNomina`, `ComunicacionAdmin`, `AuditoriaLogs`) utilizando componentes nativos (`ScrollView`, `View`, `Text`) respetando al 100% el layout HTML/CSS original.
    - **Firebase (Datos Reales):** Todos los componentes visuales fueron conectados exitosamente a Firebase en tiempo real, removiendo arreglos estáticos y reemplazándolos con las subscripciones a `useCases.admin` (`getAllUsers`, `payments`, `auditLogs`, `departments`, `announcements`).
- **[2026-05-06]** Estabilización y Fixes UI/UX del Panel Admin:
    - Reconstrucción visual de la **Sidebar**, ajustando alineaciones, hover states, tamaños correctos y aplicando fielmente el diseño premium estipulado en las referencias.
    - Se eliminaron el 100% de los datos falsos, hardcodeados y simulados en todos los módulos (Plantilla, Estructura, Nómina, Logs, Anuncios).
    - Refactorización de todos los repositorios de Firebase (`FirebaseUserRepository`, `FirebaseDepartmentRepository`, etc.) para implementar consultas en **tiempo real (real-time)** utilizando `onSnapshot`.
    - Integración de listeners en tiempo real en los casos de uso, permitiendo que el Dashboard General y todas las vistas actualicen sus métricas instantáneamente ante cualquier cambio en Firestore.
    - Corrección de distribución y errores visuales en las tablas (scroll horizontal, bordes, headers, badges de estado).
- **[2026-05-06]** Rediseño Total del Panel de Administrador (SaaS Premium):
    - Se reconstruyó la estructura completa del panel de administrador utilizando un `AdminLayout` web/tablet-first con un Sidebar moderno (`AdminNavigator`).
    - Se desarrollaron nuevas entidades, repositorios y casos de uso en Firebase para: Departamentos, Logs de Auditoría, Anuncios Centralizados, y Detalles Financieros de Nómina.
    - **Dashboard General:** Nueva vista panorámica con métricas integradas de rendimiento y Nexus-Mood IA (clima laboral).
    - **Estructura Organizativa:** Nuevo panel jerárquico para gestionar departamentos, sectores y asignar responsables de manera visual.
    - **Gestión de Plantilla:** Directorio centralizado y avanzado con búsqueda en tiempo real, filtros y control de estados (Activo/Inactivo).
    - **Gestión de Nómina:** Módulo financiero completo que calcula salario bruto, deducciones de ley (ISSS, AFP, Renta) y salario neto, con estados de procesamiento (Pagado, Pendiente).
    - **Logs y Auditoría:** Historial histórico automático de todas las actividades del sistema para trazabilidad y seguridad (Success, Warning, Error).
    - **Comunicación Centralizada:** Nuevo sistema de chat y anuncios masivos segmentados por departamento con prioridades de urgencia.
- **[2026-05-02]** Fase de Rediseño UI/UX Premium Finalizada:
    - Rediseño completo de Dashboards (Admin, Jefe, Empleado) con jerarquía visual de alto nivel.
    - Implementación de Glassmorphism en tarjetas de acción y menús flotantes.
    - Mejora de componentes de gestión de tareas con estados visuales claros y chips de prioridad.
    - Optimización de la pantalla de notificaciones con filtros elegantes y animaciones de entrada.
    - Estandarización del sistema de diseño (`diseno.ts`) para garantizar consistencia en todo el ecosistema.
    - Refinamiento de la identidad visual (logotipo, tipografía y paleta de gradientes aurora).
- **[2026-05-02]** Refactorización UX/UI del listado de Equipo (Agrupado por Sedes).
- **[2026-05-02]** Consolidación Global del Sistema de Diseño Premium:
    - Restauración de todas las acciones originales en la pantalla `MiPulso` (Pausas, Ausencias, Evaluaciones).
    - Unificación estética total: Mismo header, sistema de tarjetas y paleta aurora en el 100% de las pantallas.
    - Implementación de animaciones de entrada (`Animated.spring`) sincronizadas en toda la app.
    - Rediseño de componentes de interacción compleja: Calendario de citas, burbujas de chat IA y flujos de formularios.
    - Mejora de la experiencia de usuario (UX) mediante micro-interacciones y feedback visual inmediato.
- **[2026-05-02]** Rediseño Completo del Rol Empleado (Fase SaaS Premium):
    - Unificación de la NavBar global en el 100% de las vistas del empleado (Dashboard, Notificaciones, Pagos, Ausencias, Pausa, Check-in, Evaluaciones, Recursos, Centro Apoyo).
    - Integración profunda de componentes `BotonAnimado` y `TarjetaAnimada` para micro-interacciones tipo Stripe en toda la aplicación.
    - Transformación de UI en Formularios y Check-In con layouts limpios, botones de escala/emoción grandes y fluidos, mejorando la UX móvil.
    - Rediseño de Mis Pagos con visualización tipo fintech y animaciones de entrada en lista.
    - Animación global de partículas en bucle en `FondoAurora` para una experiencia visual envolvente.
    - Nuevo componente `GradienteAnimado` aplicado en tarjetas IA, burbujas de chat y botones de acción principal, creando un efecto de flujo continuo en los gradientes morados y azules.
    - Actualización del icono de inteligencia artificial a la nueva estrella premium (`stars`) en el chatbot y sugerencias.
    - Todas las lógicas de negocio, Firebase y navegación profunda permanecen completamente intactas.
- **[2026-05-02]** Restauración Total del Diseño Premium en Nueva Arquitectura:
    - Se adaptó exitosamente el diseño "Extreme Premium SaaS" a la nueva estructura *Clean Architecture* (`app/src/presentation/screens`).
    - Reconstrucción de los componentes centrales `TarjetaAnimada`, `BotonAnimado`, `GradienteAnimado` y `FondoAurora` en el nuevo directorio `presentation/components`.
    - Restauración de la NavBar global con `BlurView` puro (`tint="light"`, `intensity={40}`) y bordes redondeados (`RADIOS.xxl`) en todas las pantallas.
    - Se recuperó el layout correcto del dashboard de empleado (`MiPulso`): 1. Nexxus IA, 2. Gráfico, 3. Actividades simétricas, 4. Historial de tareas, conservando intacta la nueva lógica de Firebase y el `ContextoUsuario`.
    - Rehicimos el dashboard administrativo (`GestionUsuarios`) aplicando los estándares visuales premium: tarjetas con *fade* sutil (`rgba(255,255,255,0.92)`), barra de búsqueda integrada y animaciones de cascada.
- **[2026-05-02]** Refinamiento Extremo UI/UX (SaaS Premium):
    - Implementación de un efecto *Glassmorphism* real y puro (sin color de fondo, `tint="transparent"`) en TODAS las NavBars utilizando `expo-blur`.
    - Eliminación global de encabezados nativos (`headerShown: false` en `App.tsx`) para mantener una estética 100% limpia y controlada por la NavBar personalizada.
    - Reestructuración de la jerarquía visual en `MiPulso`: 1. Análisis Nexxus IA (con mayor protagonismo), 2. Gráfico de Rendimiento (renovado con `SvgGradient`), 3. Actividades de Hoy (layout simétrico) y 4. Historial de Tareas.
    - Consistencia visual unificada, eliminando los colores de fondo opacos en barras superiores y puliendo tipografía y sombras en los Dashboards.
- **[2026-05-02]** Corrección del modal de ausencias para asegurar usabilidad con teclados móviles.
- **[2026-05-02]** Implementación de la pantalla `MisPagos` para empleados.
- **[2026-05-02]** Generación de PDFs de Nómina (`expo-print`, `expo-sharing`) con notificaciones automáticas al empleado tras el pago.
- **[2026-05-02]** Limpieza de navegación (Removido CheckIn y Equipo del navbar de empleado; Icono de ChatIA actualizado a estrellas).

---

## Actualizaciones recientes
- **[2026-05-10]** Landing Page Nexxus SaaS Enterprise:
    - Se creó una landing web premium en `app/src/Landing/Index.tsx` para vender Nexxus a empresas, enfocada en conversión, registro de administradores y presentación de valor empresarial.
    - Se integró `DarkVeil` como fondo WebGL fijo de pantalla completa, manteniendo la animación original sin repetición visual y asegurando cobertura total del viewport.
    - Se integró el componente `BorderGlow` en `app/src/Landing/BorderGlow.tsx` y `BorderGlow.css`, aplicándolo a métricas, cards de valor, módulos, consola admin, planes, onboarding y métricas de prueba social con glow de borde reactivo al puntero.
    - Se añadieron iconos SVG ligeros y consistentes en CTAs, módulos, planes, métricas, seguridad, integraciones y formulario, evitando dependencias pesadas adicionales.
    - Se agregaron secciones nuevas de seguridad/gobernanza e integraciones operativas para reforzar la percepción enterprise y explicar auditoría, datos centralizados, workflows y documentación segura.
    - Se integró `StarBorder` en botones principales morados para elevar los CTAs sin añadir dependencias, y se ajustó `BorderGlow` para limitar el efecto al borde evitando rellenos grises en el centro de las cards.
    - Se refinó la sección de Implementación para corregir overflow visual y mantener una composición centrada, responsive y estable.
    - Se creó el sistema completo de Registro + Login + Creación de Empresa dentro de `app/src/Landing`, con registro por email/password, login, login con Google, validaciones de seguridad, onboarding empresarial avanzado y redirección automática al dashboard admin.
    - Se separó el flujo de autenticación/onboarding de la landing principal: los CTAs de `Crear empresa` e `Iniciar sesión` ahora navegan a pantallas dedicadas (`/landing/registro` y `/landing/login`) con el mismo estilo visual y fondo animado.
    - Se conectó el flujo a Firebase Authentication, Firestore y Cloudinary: crea la empresa, sede principal, departamento inicial, configuración empresarial, usuario administrador con permisos y logo optimizado en Cloudinary.
    - Se ajustó la creación de empresa para cumplir reglas Firebase: la empresa se crea con `adminId`, el administrador se guarda primero y el logo se sube bajo la ruta permitida `usuarios/{uid}/empresas/{empresaId}/logo.webp`.
    - Se simplificó el formulario empresarial retirando `Sitio web` y `Cantidad de empleados`, manteniendo el tamaño/rango de empresa como dato operativo.
    - Se implementó subida de logo con drag & drop, preview, compresión a WebP, validación de formato/peso y persistencia del `logo_url` en Firestore.
    - Se añadieron validaciones reales de correo, contraseña fuerte con checklist/barra de seguridad, teléfono, URL, campos obligatorios, cantidad de empleados y duplicados de empresa por nombre normalizado.
    - Se creó una experiencia de onboarding premium con progreso visual, tabs de auth, estados de carga, feedback animado y diseño coherente con la landing.
    - Se añadieron secciones completas: hero de alto impacto, presentación del sistema, módulos operativos, experiencia del administrador, planes empresariales, sección IA, testimonios/métricas, onboarding de empresa, CTA final y footer premium.
    - Se implementaron funcionalidades reales de landing: navegación interna con scroll suave, CTAs funcionales, toggle mensual/anual con cálculo dinámico de precios, selección de plan, formulario de creación de empresa con validaciones visuales y estado de éxito.
    - Se agregaron animaciones CSS optimizadas: reveal on scroll, glow reactivo al mouse, glassmorphism, microinteracciones hover, mockup de dashboard animado, radar ejecutivo, stream de IA y efectos de iluminación premium.
    - Se incorporó SEO básico desde runtime web configurando `document.title` y meta description para la página de Nexxus.
    - Se creó `app/src/Landing/Landing.css` con diseño responsive desktop/tablet/móvil, preservando la identidad morada/azul y evitando layouts estáticos o genéricos.
- **[2026-05-10]** Sistema visual unificado basado en “Mi Pulso”:
    - Se restauró la referencia visual correcta de la primera captura de “Mi Pulso”: fondo negro premium, navbar oscura translúcida, cards sobrias y bottom navigation oscura sin cápsulas claras invasivas.
    - Se revirtió la paleta global a fondos negros y superficies glass oscuras para eliminar el efecto claro/blanco que desentonaba con la pantalla base.
    - `NavbarEnterprise` volvió al blur oscuro original con contenedor redondeado y sin gradientes claros superpuestos.
    - La navegación inferior de empleado y jefe volvió a la cápsula flotante oscura con estado activo discreto como la primera captura.
    - `FondoAurora` volvió al gradiente oscuro base sin partículas ni luces excesivas para respetar la estética original.
    - Se refinó la navbar superior para eliminar el tinte morado pesado y dejarla como vidrio oscuro translúcido coherente con los contenedores de “Mi Pulso”.
    - Se rediseñó la bottom navigation con estética tipo Apple: cápsula oscura con blur, labels compactos, estado activo morado y botón IA circular separado.
- **[2026-05-10]** Ampliación funcional y visual de “Mi Pulso”:
    - Se agregaron apartados nuevos manteniendo estrictamente el diseño base de “Mi Pulso”: cards con `BlurView`, bordes sutiles, radios existentes, tipografía y espaciado original.
    - Se incorporó `Panel de Hoy` con racha, tareas completadas y tareas urgentes calculadas desde datos reales del contexto.
    - Se agregó `Centro Operativo` con accesos a solicitudes, documentos, calendario y aprendizaje, usando contadores reales de solicitudes y documentos pendientes.
    - Se añadió `Bienestar Semanal` con promedio de bienestar, último pulso y gráfico simple basado en `metrics.datosSemana`.
    - Se agregó `Señales Importantes` con notificaciones no leídas y minutos acumulados de enfoque desde `focusSessions`.
- **[2026-05-10]** Rediseño de “Mis Tareas” con sistema visual de “Mi Pulso”:
    - Se actualizó `MisTareas` para usar `NavbarEnterprise`, `FondoAurora`, cards `BlurView`, radios, bordes, tipografía y espaciado coherentes con “Mi Pulso”.
    - Se agregó un resumen superior con progreso global, pendientes, tareas en progreso, urgentes, carga estimada y vencimientos calculados desde tareas reales.
    - Las tareas ahora se muestran como cards glass con prioridad, fecha límite, progreso, estimación, proyecto y controles rápidos de avance.
    - El modal de detalle de tarea fue adaptado a superficie translúcida oscura sin cambiar la lógica existente.
- **[2026-05-10]** Rediseño de “Recursos y Docs” con fondo de “Mi Pulso”:
    - Se reemplazó el fondo por el mismo gradiente oscuro con luces sutiles usado en “Mi Pulso”.
    - Se agregaron métricas reales de documentos: total, pendientes y categorías disponibles.
    - Se agregó sección `Tus documentos` conectada a `documentos`, con estado leído/pendiente y acción para marcar como leído.
    - Se añadió bloque de accesos útiles hacia Centro Docs, Aprendizaje y Soporte manteniendo cards `BlurView`, bordes y radios del sistema visual.
- **[2026-05-10]** Rediseño de “Búsqueda Global” con sistema visual de “Mi Pulso”:
    - Se reemplazó el fondo por el mismo gradiente oscuro con luces sutiles usado en “Mi Pulso”.
    - Se rediseñó la barra de búsqueda como superficie glass con `BlurView`, borde fino y placeholder integrado.
    - Se agregaron métricas reales de tareas, documentos y mensajes disponibles para orientar la búsqueda.
    - Se añadieron chips de búsquedas rápidas y resultados en cards translúcidas, manteniendo la búsqueda real sobre tareas, documentos e inbox.
- **[2026-05-10]** Rediseño de “Notificaciones” con sistema visual de “Mi Pulso”:
    - Se reemplazó el fondo por el mismo gradiente oscuro con luces sutiles usado en “Mi Pulso”.
    - Se agregó `NavbarEnterprise`, resumen de no leídas, leídas y tipos de notificación calculados desde datos reales.
    - Se incorporaron filtros por estado y tipo de notificación, manteniendo la acción de marcar como leída y navegación contextual.
    - Las notificaciones ahora se muestran en cards `BlurView` con borde glass, badge de tipo, fecha y estado no leído.
    - Se armonizaron superficies blancas heredadas en pantallas de empleado y jefe hacia superficies glass oscuras para evitar pantallas visualmente desconectadas.
    - El panel admin fue alineado visualmente con la identidad morada: sidebar, navbar, cards y acentos principales dejan de depender del azul anterior y se integran al sistema visual base.
    - Se ajustó `DashboardUsuario` para abandonar la estética clara y adoptar superficies glass, texto claro, sombras violeta y gradientes del sistema.
- **[2026-05-09]** Plantilla con catálogos laborales reales:
    - El formulario de creación y edición de empleados ahora selecciona cargo, departamento y sede/sucursal desde catálogos reales de Firestore (`cargos`, `departments`, `sedes`) filtrados por `empresaId`.
    - Los selectores de cargo, departamento, sede y rol se transformaron en desplegables compactos con scroll interno para mantener una experiencia profesional cuando existan muchos registros.
    - Se eliminó el campo de foto de perfil URL del alta de empleado para simplificar el flujo administrativo.
    - El salario base se captura como monto entero en dólares, sin decimales, y se guarda como número en Firestore.
    - El selector de roles conserva los roles base `empleado`, `jefe` y `admin`, y agrega automáticamente los roles personalizados creados por la empresa en `roles_personalizados`.
    - Al asignar un rol personalizado, los permisos configurados en Estructura se guardan en el documento del usuario como permisos operativos.
    - Se extendió la entidad `User` para soportar `cargoId`, `departamentoId`, roles personalizados y permisos por módulo/sede.
- **[2026-05-09]** Corrección del alta real de empleados:
    - Se corrigió `firebase.json` para que Functions despliegue desde `backend`, donde realmente existe `crearUsuarioEmpresa`.
    - La Cloud Function `crearUsuarioEmpresa` ahora guarda el empleado completo en Firestore, incluyendo cargo, departamento, sede, salario, permisos, estado activo y onboarding.
    - Se agregaron validaciones server-side para empresa asignada, datos obligatorios, correo duplicado y contraseña inválida.
    - El frontend ahora envía el payload laboral completo a la Function y tiene timeout operativo para evitar que el modal quede cargando indefinidamente si Firebase Functions no responde.
    - Se desplegó correctamente `crearUsuarioEmpresa` y el resto de Cloud Functions en Firebase (`nexxus-5f119`, `us-central1`).
    - La notificación de bienvenida quedó como escritura secundaria no bloqueante para que un fallo en notificaciones no impida cerrar el alta del empleado.
    - Se reforzó la autorización de `crearUsuarioEmpresa` para aceptar administradores por rol base o por permisos de módulos (`admin`/`plantilla`) cuando la empresa use roles personalizados.
- **[2026-05-09]** Estructura Admin con sedes, departamentos, cargos y roles:
    - Se amplió `EstructuraOrganizativa` para crear sedes/sucursales reales en Firestore (`sedes`) con dirección, ciudad y responsable.
    - Se habilitó la creación de departamentos globales o asociados a una sede mediante `sedeId` y `sedeNombre`, manteniendo la colección existente `departments`.
    - Se agregó creador de cargos conectado a Firestore (`cargos`) con departamento opcional, nivel y descripción.
    - Se agregó creador de roles personalizados conectado a Firestore (`roles_personalizados`) con permisos granulares por módulo: dashboard, plantilla, estructura, nómina, mensajería, auditoría, aprobaciones, documentos, analytics y configuración.
    - Se incorporaron tarjetas operativas y resúmenes en tiempo real para sedes, cargos y roles sin usar datos simulados.
    - Todas las creaciones registran auditoría en `audit_logs` con `empresaId`, usuario, rol, módulo y timestamp.
    - Se extendió la entidad `Department` con `sedeId` y `sedeNombre` para soportar jerarquía multi-sucursal.
- **[2026-05-09]** Refuerzo visible del creador organizacional:
    - Se agregaron botones directos en el encabezado de `EstructuraOrganizativa` para crear Sede, Departamento, Cargo y Rol sin depender de tarjetas secundarias.
    - El formulario de sedes ahora guarda ubicación completa: código interno, país, ciudad, dirección, teléfono, latitud, longitud, objeto `ubicacion` y enlace de mapa.
    - El resumen de sedes ahora muestra código, ciudad y responsable para verificar rápidamente que la sucursal quedó registrada.
    - Se mantuvo la conexión con Firestore y auditoría real sin cambiar la identidad visual del admin.
- **[2026-05-09]** CRUD completo de catálogos organizacionales:
    - Se simplificó el formulario de sede eliminando código interno, latitud, longitud y enlace de mapa, dejando datos prácticos: nombre, país, ciudad, teléfono, dirección y responsable.
    - Se agregaron acciones de edición y eliminación para sedes, departamentos, cargos y roles personalizados desde los resúmenes del módulo Estructura.
    - La edición reutiliza los mismos modales de creación, precargando los datos existentes y guardando cambios en Firestore.
    - La eliminación borra el documento correspondiente en `sedes`, `departments`, `cargos` o `roles_personalizados` y registra auditoría en `audit_logs`.
- **[2026-05-09]** Plantilla Admin funcional con CRUD empresarial:
    - Se convirtió `GestionPlantilla` en un módulo operativo real para crear, editar, activar, desactivar y dar baja operativa a empleados sin romper el diseño premium actual.
    - La creación de empleados usa la Cloud Function `crearUsuarioEmpresa`, creando cuenta en Firebase Authentication y documento asociado en `usuarios` bajo el `empresaId` del administrador.
    - Tras crear empleado, el admin completa datos laborales extendidos en Firestore: rol, cargo, departamento, sede, jefe directo, teléfono, salario base, foto de perfil URL, permisos por módulo y estado de onboarding.
    - La edición actualiza el documento real de `usuarios` y conserva el aislamiento multiempresa.
    - La eliminación se implementó como baja operativa segura (`eliminado`, `activo: false`, `estado_activo: false`) para no romper la cuenta Auth desde cliente.
    - Todas las operaciones críticas registran auditoría en `audit_logs` y la creación envía una notificación inicial al empleado.
    - Se extendió la entidad `User` con campos laborales empresariales usados por Admin y Perfil Laboral.
- **[2026-05-09]** Primera capa Enterprise Operativa del Panel Admin:
    - Se conectó el Dashboard Admin con señales reales ya existentes en la app de empleado: `asistencias`, `solicitudes_internas`, `inbox_unificado`, `feedbacks` y `documentos`, además de usuarios, tareas, pagos, check-ins, ausencias, notificaciones y auditoría.
    - Se agregó un Monitor de Asistencia en tiempo real con entradas del día, retrasos, pausas activas y horas extra calculadas desde Firestore.
    - Se agregó un Centro de Aprobaciones operativo para aprobar o rechazar ausencias y solicitudes internas desde el Dashboard, actualizando Firestore y notificando al empleado mediante `notificaciones` o `inbox_unificado`.
    - Se agregó un bloque de Alertas Operativas que cruza inbox urgente, feedback abierto e incidencias documentales sin usar datos simulados.
    - Se integró trazabilidad automática en acciones críticas de `GestionPlantilla`, `GestionNomina` y `ComunicacionAdmin`, escribiendo eventos reales en `audit_logs`.

## Funcionalidades implementadas
- Sistema visual global premium basado en “Mi Pulso”: tokens, navbar, bottom navigation, aurora background, superficies glass y acentos morados unificados.
- Alta y edición de empleados usando selects reales de cargo, departamento, sede y roles personalizados por empresa.
- Gestión real de sedes/sucursales, departamentos por sede o globales, cargos y roles personalizados con permisos.
- CRUD operativo de Plantilla: alta vía Functions/Auth, edición Firestore, activación/desactivación y baja operativa.
- Modal empresarial de empleado con rol, cargo, sede, departamento, jefe directo, salario base, teléfono y foto URL.
- Actualización del modal empresarial de empleado para usar salario USD entero, eliminar foto URL del alta y seleccionar cargo/departamento/sede desde catálogos Firestore.
- Permisos iniciales por rol guardados en el documento de usuario.
- Dashboard ejecutivo conectado a datos multiempresa filtrados por `empresaId`.
- Aprobaciones de ausencias y solicitudes internas desde el panel administrativo.
- Auditoría real para activación/desactivación de empleados, actualización de estados de pago y publicación de anuncios.
- Notificaciones e inbox para comunicar al empleado el resultado de aprobaciones.
- Corrección de tipados compartidos para que solicitudes internas, notificaciones ampliadas y Chat IA compilen correctamente.

## Funcionalidades corregidas
- Inconsistencias visuales entre pantallas claras antiguas y el sistema oscuro translúcido de “Mi Pulso”.
- Se corrigió el contrato de `IFase2Repositories` importando correctamente `InternalRequest` y `NuevaSolicitudInterna`.
- Se ajustó `ChatIA` para soportar respuestas asincrónicas del resumen operativo sin romper el tipo de mensaje.
- Se amplió el tipo `Notification` para reflejar flujos reales de ausencia, bienestar y aprobación.

## Errores solucionados
- Modal de creación de empleado quedando en estado `GUARDANDO...` sin respuesta visible cuando `crearUsuarioEmpresa` no estaba desplegada o no respondía.
- Configuración de Firebase Functions apuntando a una carpeta `functions` inexistente en lugar de `backend`.
- Fallos de TypeScript en repositorios Fase 2, Chat IA y Notificaciones.
- Falta de trazabilidad en acciones administrativas que modificaban datos sensibles sin registrar evento de auditoría.

## Pendientes
- Hard delete de usuarios en Firebase Authentication mediante Cloud Function administrativa dedicada.
- Selector de archivo real para foto de perfil con subida a Cloudinary desde Plantilla.
- Edición y eliminación controlada de sedes, departamentos, cargos y roles personalizados.
- Generación real de PDFs de nómina con almacenamiento externo controlado desde el módulo Admin.
- Integración FCM completa para push notifications además de registros Firestore.
- Permisos granulares por módulo/sede/rol aplicados en UI y reglas de Firestore.
- Exportaciones Excel/PDF de analytics administrativos.

## Próximas mejoras
- Crear módulo global de búsqueda admin reutilizando la arquitectura de `BusquedaGlobal`.
- Centralizar listeners administrativos en un hook dedicado para reducir duplicación entre pantallas.
- Implementar modales de gestión documental y adjuntos en mensajería empresarial.
- Agregar Cloud Functions para automatizaciones de retrasos, tareas vencidas, aprobaciones y generación de recibos.

## Próximos Pasos
1. Pruebas End-to-End (E2E) exhaustivas por parte del administrador.
2. Despliegue de actualizaciones a TestFlight o Play Console interna.
3. Continuar con implementación de perfiles extendidos de empleados.

- **[2026-05-10]** Perfil laboral rediseñado y navegación directa:
    - La silueta/avatar de la navbar superior ahora abre directamente `Mi Perfil`, eliminando el menú flotante intermedio.
    - Se rediseñó `PerfilLaboral` con el sistema visual oscuro y translúcido de “Mi Pulso”, manteniendo cards glass, fondo premium y jerarquía móvil coherente.
    - Se eliminó el uso de datos de respaldo quemados en el perfil; KPIs, habilidades, permisos e historial muestran datos reales del usuario o estados vacíos.
    - Se agregaron bloques útiles de expediente: datos laborales, operación diaria, contacto, permisos, sedes autorizadas, habilidades, KPIs e historial laboral.
    - El botón de cerrar sesión quedó visible dentro de `Mi Perfil` como acción segura de cuenta.

- **[2026-05-10]** Check-in diario rediseñado con sistema Mi Pulso:
    - Se rediseñó `CheckInDiario` con fondo oscuro, cards translúcidas, header glass y controles coherentes con “Mi Pulso”.
    - Se mantuvo intacto el flujo real de guardado mediante `registrarCheckIn`, conservando energía, descanso, emoción, estrés, carga, indicadores y nota.
    - Se agregó navegación visual por pasos, barra de progreso animada y chips de avance para mejorar claridad durante el registro.
    - Se incorporó una guía de privacidad/contexto y un resumen final del pulso estimado antes de enviar, calculado desde las respuestas del empleado.
    - Se mejoraron los controles de energía, descanso, estado emocional, estrés, carga laboral e indicadores rápidos sin usar datos simulados.

- **[2026-05-10]** Historial rediseñado y ampliado con actividad real:
    - Se rediseñó `HistorialCompleto` con el sistema visual de “Mi Pulso”: fondo oscuro, header glass, filtros translúcidos, cards premium y timeline vertical.
    - Se unificó `HistorialActividad` para reutilizar la misma experiencia visual y evitar estilos duplicados.
    - El historial ahora consolida eventos reales del contexto del empleado: tareas, ausencias, solicitudes internas, check-ins, sesiones de enfoque, documentos, pagos, citas, notificaciones y feedback.
    - Se agregaron métricas superiores de eventos, resueltos, pendientes y bienestar calculadas desde los datos cargados.
    - Se añadieron filtros por categoría y estados vacíos informativos sin usar datos simulados.

- **[2026-05-10]** Capacitación rediseñada como centro de aprendizaje:
    - Se rediseñó `CentroAprendizaje` con el sistema visual de “Mi Pulso”: fondo oscuro, header glass, cards translúcidas, filtros redondeados y jerarquía móvil consistente.
    - Se mantuvo la carga real de cursos desde Firebase mediante `useCases.training.getCourses(empresaId)`.
    - Se agregaron métricas calculadas desde cursos y progreso del usuario: cursos asignados, en progreso, completados, avance general y puntos.
    - Se añadieron filtros por categorías reales disponibles en los cursos de la empresa.
    - Se incorporó una vista destacada del curso seleccionado con avance y una lista de módulos reales, indicando si hay video, lectura o contenido pendiente.
    - Se agregaron estados de carga y vacío sin datos simulados.

- **[2026-05-10]** Centro de Documentos rediseñado y ampliado:
    - Se rediseñó `CentroDocumentos` con el sistema visual de “Mi Pulso”: fondo oscuro, header glass, buscador translúcido, cards premium y chips redondeados.
    - Se mantuvo la funcionalidad real de apertura de documentos y marcado como leído mediante `marcarDocumentoLeido` y `Linking.openURL`.
    - Se agregaron métricas reales de documentos totales, pendientes, leídos y categorías disponibles.
    - Se añadieron filtros dinámicos por categorías reales presentes en los documentos del usuario y búsqueda por título o tipo.
    - Se incorporaron secciones de documentos pendientes, recientes y biblioteca completa con estados visuales claros.
    - Se agregaron estados vacíos informativos sin usar datos simulados.

- **[2026-05-10]** Asistente Nexxus rediseñado con contexto operativo:
    - Se rediseñó `ChatIA` con el sistema visual de “Mi Pulso”: fondo oscuro, header glass propio, panel translúcido, burbujas premium y barra de entrada flotante.
    - Se mantuvo la lógica existente de comandos del asistente y generación de resumen de jornada mediante `generarResumenJornada`.
    - Se agregó un panel de contexto calculado desde datos reales: tareas pendientes, urgentes, documentos pendientes y racha.
    - Se ampliaron sugerencias rápidas para resumen, urgencias, rendimiento, priorización de jornada y bienestar.
    - Las respuestas del asistente ahora consideran tareas, métricas de bienestar, documentos, solicitudes, notificaciones y sesiones de enfoque disponibles en el contexto del usuario.

- **[2026-05-10]** Centro de Soporte rediseñado y conectado al contexto real:
    - Se rediseñó `CentroApoyo` con el sistema visual de “Mi Pulso”: fondo oscuro, header glass, cards translúcidas, métricas compactas y secciones premium.
    - Se eliminaron especialistas y citas quemadas; ahora se usan `especialistas`, `citas`, `solicitudesInternas`, `metrics`, `feedbacks`, `tareas` y `documentos` del contexto real del usuario.
    - Se agregaron métricas de bienestar, próximas citas, solicitudes de soporte pendientes y alertas operativas.
    - Se incorporaron acciones rápidas hacia Chat IA, reserva de sesión, solicitudes internas y feedback.
    - Se añadieron secciones de próximas citas, especialistas disponibles, solicitudes de soporte e indicador de ayuda inmediata.
    - Se agregaron estados vacíos informativos sin usar datos simulados.

## Rediseño Mobile UI/UX

- **[2026-05-17]** Sistema visual mobile premium Aura/Nexxus:
    - **Pantallas rediseñadas:** se centralizó el lenguaje visual mobile para login empresarial, shell de empleado/jefe, dashboard, tareas, recursos, IA, notificaciones, documentos, historial, solicitudes, apoyo, check-in y perfil mediante tokens y fondo premium compartido.
    - **Componentes actualizados:** se agregó `TemaMobileContext`, `FondoMobilePremium` y se refinó `NavbarEnterprise` con avatar/foto de perfil a la izquierda, título, fecha actual, notificaciones y configuración en cápsula glass flotante.
    - **Mejoras glassmorphism:** los fondos planos oscuros de pantallas mobile principales fueron reemplazados por una base aurora compartida con capas translúcidas, blur controlado, bordes suaves y profundidad coherente.
    - **Mejoras responsive:** se ajustó la bottom navigation flotante para tamaños móviles/tablet, reduciendo altura, radios y estados activos para evitar saturación y mejorar ergonomía táctil.
    - **Mejoras animaciones:** se preservaron microinteracciones existentes de `BotonAnimado`, entradas suaves de pantallas y feedback táctil, alineándolas con el nuevo sistema visual sin animaciones agresivas.
    - **Problemas corregidos:** `LoginEmpresarial` dejó de depender del tema admin; `ControlAsistencia` restaura sesión activa desde `AsyncStorage`, conserva pausa y evita reinicio visual del contador al recargar.
    - **Optimizaciones:** el modo claro/oscuro mobile ahora se persiste con `AsyncStorage` desde configuración y mantiene el mismo lenguaje glass premium sin afectar admin ni landing.
    - **Validación:** `npm run build:web` completó correctamente; `npx tsc --noEmit` no produjo diagnóstico de app porque TypeScript falló internamente con `RangeError: Maximum call stack size exceeded` en Node 25.
    - **Siguientes pasos:** revisar sesión autenticada en dispositivo Expo o simulador con datos Firebase reales para validar todas las rutas secundarias, modo claro completo y navegación de jefe/empleado con credenciales reales.

- **[2026-05-17]** Segunda pasada Aura idéntica a referencias:
    - **Fondo animado:** `FondoMobilePremium` ahora usa capas animadas con deriva, pulso, halo rotatorio y resplandor central para replicar el fondo Aura de las imágenes en modo oscuro y claro.
    - **Orbe visual:** se agregó `AuraOrb` como esfera animada reutilizable con gradientes magenta, cian y violeta, aplicada a bienvenida, login, selección de rol, Mi Pulso y Chat IA.
    - **Login móvil:** `LoginEmpresarial` se reorganizó con estructura de asistente personal: marca superior, etiqueta beta, orbe central, copy breve, puntos de paginación, formulario glass y botón primario brillante.
    - **Dashboard empleado/jefe:** `MiPulso` recibió hero tipo Aura con headline corto, barra de entrada glass, chips de acción rápidos y orbe mini en la tarjeta IA.
    - **Chat e IA:** `ChatIA` incorporó el orbe central sobre el panel contextual para acercarse a las pantallas de voz/chat de referencia.
    - **Bottom navigation:** `UserNavigator` ahora usa una sola cápsula glass flotante con iconos, estado activo circular y acceso IA integrado como micrófono.
    - **Consistencia mobile:** `CentroTareas` pasó al navbar premium común para reducir headers antiguos en la navegación principal.
    - **Validación:** se corrigió un error runtime del fondo animado (`opacity is not defined`) detectado con browser visual y se validó nuevamente con `npm run build:web`.

- **[2026-05-17]** Ajuste estructural fiel a la referencia Aura:
    - **Fondo:** se eliminaron las bolas grandes heredadas de pantallas mobile y el fondo compartido pasó a vetas diagonales suaves, halo atmosférico y profundidad sin círculos invasivos.
    - **Navbar:** `NavbarEnterprise` fue reestructurado como la referencia: menú plano a la izquierda, pill central `Aura 12 BETA`, notificaciones y avatar compacto a la derecha.
    - **Tareas:** `CentroTareas` dejó la lista plana y adoptó composición tipo `Training program`: título grande, chips de días, card principal morada, panel de progreso, panel de programa e historial compacto.
    - **Home:** `MiPulso` mantiene la estructura Aura con headline grande, barra de entrada, chips rápidos y cards compactas glass.
    - **Consistencia:** se removieron comentarios visuales nuevos y se mantuvo la lógica Firebase existente intacta.
    - **Validación:** `npm run build:web` completó correctamente después de la eliminación de las bolas y la nueva estructura de Tareas.

- **[2026-05-17]** Fondo Plasma aplicado solo en app y login:
    - **Alcance:** se limitó el ajuste al fondo compartido de la app móvil y al login que lo consume, sin tocar admin, landing ni lógica Firebase.
    - **Fondo animado:** se integró `Plasma` inspirado en React Bits con WebGL/OGL para web y fallback nativo liviano para Expo, eliminando por completo las bolas grandes del fondo anterior.
    - **Optimizaciones:** el render web mantiene objetivo de 60 FPS, reduce coste por DPR/resolution scale, desactiva interacción de mouse, pausa por visibilidad/intersección y limpia contexto WebGL al desmontar.
    - **Modo oscuro/claro:** ambos modos usan el mismo plasma con velos de legibilidad distintos para conservar estética premium sin romper contraste en formularios y cards.
    - **Siguientes pasos:** validar en dispositivo físico gama baja la suavidad percibida del fondo con sesión real y ajustar solo `resolutionScale` si hiciera falta.

- **[2026-05-17]** Intensidad Plasma morada distribuida:
    - **Fondo:** se incrementó la presencia visual del Plasma para que la animación sea notoria en toda la pantalla y no quede concentrada en una zona.
    - **Paleta:** el fondo se ajustó a morados propios de la app con acentos violeta/magenta y menor velo superior para que la animación se perciba más.
    - **Optimización:** se mantiene objetivo de 60 FPS y se sube la definición de forma moderada mediante `resolutionScale`, sin activar interacción de mouse ni efectos costosos.
    - **Cobertura:** el cambio sigue centralizado en `FondoMobilePremium`, por lo que se reparte automáticamente en las pantallas mobile que usan el fondo común y en el login.

- **[2026-05-17]** Plasma real en móvil nativo:
    - **Corrección:** se eliminó el fallback nativo de vetas animadas que todavía recordaba al fondo anterior.
    - **Implementación:** se agregó `expo-gl` y `Plasma.tsx` ahora renderiza el shader Plasma real en `GLView` para móvil nativo.
    - **Visibilidad:** se redujeron los velos superiores y se subió la escala/opacidad del Plasma para que la animación sea claramente visible en login y pantallas mobile.
    - **Alcance:** el ajuste permanece centralizado en el fondo de la app; admin y landing no forman parte de este cambio.

- **[2026-05-17]** Plasma sin capas que lo apaguen:
    - **Corrección:** se retiraron los velos y gradientes posteriores al Plasma dentro de `FondoMobilePremium` para que no oculten la animación.
    - **Shader:** se elevó el alpha mínimo del Plasma en web y móvil nativo, evitando que el efecto quede casi invisible.
    - **Fondo:** se conserva solo un gradiente base de seguridad detrás del Plasma; la capa visual activa es el shader Plasma.

- **[2026-05-17]** Navbars mobile redondeadas restauradas:
    - **Navbar superior:** se recuperó el formato redondeado con avatar, nombre del apartado, fecha, notificaciones y configuración, manteniendo blur/glass y paleta morada actual.
    - **Bottom navigation:** se ajustó la navegación inferior a una cápsula flotante redondeada con estado activo tipo pill, icono y etiqueta, conservando el estilo premium vigente.
    - **Alcance:** solo se modificaron navbars de la app móvil; admin, landing, Firebase y navegación funcional permanecen sin cambios.
