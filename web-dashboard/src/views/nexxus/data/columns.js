// Columnas para tablas con datos reales de Firestore (ver services/superAdminRepository.js).
export const columnsEmpresasRecientes = [
  { Header: "EMPRESA", accessor: "nombre" },
  { Header: "PLAN", accessor: "plan" },
  { Header: "ESTADO", accessor: "estado" },
  { Header: "REGISTRADA", accessor: "fecha" },
];

export const columnsActividadReciente = [
  { Header: "ACCIÓN", accessor: "accion" },
  { Header: "MÓDULO", accessor: "modulo" },
  { Header: "EMPRESA", accessor: "empresa" },
  { Header: "FECHA", accessor: "fecha" },
  { Header: "ESTADO", accessor: "status" },
];
