# Reporte de Progreso — Nexxus

## Estado General
**Última actualización:** 2026-05-14

---

## ✅ Completado

### Admin Portal — Estabilización UI/UX
- Navbar spacing y paddingTop consistente en todos los módulos
- Traducciones i18n corregidas (formularios de Estructura, Comunicación, etc.)
- Fotos de perfil dinámicas en tablas de departamentos y feed de comunicación
- Roles de administrador unificados ("admin")
- Barra de búsqueda y filtros en Gestión de Plantilla
- Módulo de Configuración corregido (useRef)

### Módulo de Nómina — Implementación v1
- Dashboard KPIs en tiempo real (Firebase)
- Perfiles salariales por empleado
- Procesamiento individual y masivo de nómina
- Cálculos legales El Salvador (ISSS 3%, AFP 7.25%, renta progresiva)
- Historial de pagos con filtros
- Exportación PDF y CSV
- Alertas de anomalías (reglas determinísticas)

---

## 🕐 Pendiente

### Portal del Empleado — Acceso a Recibos de Pago
**Prioridad:** Media
**Descripción:** Los colaboradores deben poder visualizar y descargar sus recibos de pago en PDF desde la app del empleado (no del admin). Incluye:
- Vista de historial de pagos personales
- Descarga de recibo en PDF
- Notificaciones automáticas cuando se procesa la nómina
- Historial financiero personal

**Notas:** De momento solo está cubierta la vista del administrador. Esta funcionalidad requiere integración con la pantalla de perfil del empleado o una nueva ruta `/mis-recibos`.

---

## 🔧 En Progreso

_(ninguno actualmente)_

---

## 📝 Backlog Técnico
- Integración con banco para transferencias automáticas
- Conectar asistencia real con cálculo de horas extra
- Aguinaldo y vacaciones proporcionales automáticas
- Módulo de retenciones avanzadas (ISR exacto según DGII)
