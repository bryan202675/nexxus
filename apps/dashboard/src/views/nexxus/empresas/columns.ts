// Columnas locales de la pantalla Empresas (datos reales via services/superAdminRepository.js).
// No se reutiliza views/nexxus/data/columns.js a proposito, para no chocar con otras pantallas.
export const columnsEmpresas = [
  { Header: "LOGO", accessor: "logo" },
  { Header: "EMPRESA", accessor: "nombre" },
  { Header: "PLAN", accessor: "plan" },
  { Header: "ESTADO", accessor: "estadoLabel" },
  { Header: "REGISTRADA", accessor: "fechaLabel" },
];

export const columnsUsuariosEmpresa = [
  { Header: "NOMBRE", accessor: "nombre" },
  { Header: "CORREO", accessor: "correo" },
  { Header: "ROL", accessor: "rolLabel" },
  { Header: "ESTADO", accessor: "estadoLabel" },
];

export const columnsPagosEmpresa = [
  { Header: "PLAN", accessor: "plan" },
  { Header: "MONTO", accessor: "montoLabel" },
  { Header: "ESTADO", accessor: "status" },
  { Header: "FECHA", accessor: "fechaLabel" },
];
