// Columnas locales de la pantalla Estructura (datos reales via services/adminRepository.js).
export const columnsDepartamentos = [
  { Header: "DEPARTAMENTO", accessor: "nombreLabel" },
  { Header: "SEDE", accessor: "sedeLabel" },
  { Header: "JEFE", accessor: "jefeLabel" },
  { Header: "HEADCOUNT", accessor: "headcountLabel" },
  { Header: "COBERTURA", accessor: "coberturaLabel" },
  { Header: "ESTADO", accessor: "estadoLabel" },
];

export const columnsSedes = [
  { Header: "SEDE", accessor: "nombreLabel" },
  { Header: "DIRECCIÓN", accessor: "direccionLabel" },
  { Header: "EMPLEADOS", accessor: "empleadosLabel" },
];

export const columnsCargos = [
  { Header: "CARGO", accessor: "nombreLabel" },
  { Header: "DEPARTAMENTO", accessor: "departamentoLabel" },
  { Header: "EMPLEADOS", accessor: "empleadosLabel" },
];

export const columnsRoles = [
  { Header: "ROL", accessor: "nombreLabel" },
  { Header: "DESCRIPCIÓN", accessor: "descripcionLabel" },
  { Header: "PERMISOS", accessor: "permisosLabel" },
];
