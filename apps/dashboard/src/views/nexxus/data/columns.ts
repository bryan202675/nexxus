// Columnas para tablas con datos reales de Firestore (ver services/superAdminRepository.js).
export const columnsEmpresasRecientes = [
  { Header: "EMPRESA", accessor: "nombre" },
  { Header: "PLAN", accessor: "plan" },
  { Header: "ESTADO", accessor: "estado" },
  { Header: "REGISTRADA", accessor: "fecha" },
];

// audit_logs no tiene columna de estado/severidad, asi que no se incluye una columna de
// estado fabricada aqui (ver superAdminRepository.mapAudit).
export const columnsActividadReciente = [
  { Header: "ACCIÓN", accessor: "accion" },
  { Header: "MÓDULO", accessor: "modulo" },
  { Header: "EMPRESA", accessor: "empresa" },
  { Header: "FECHA", accessor: "fecha" },
];
