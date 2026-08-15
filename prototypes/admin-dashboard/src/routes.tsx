import React from 'react';

// Icon Imports
import {
  MdHome,
  MdPeople,
  MdGroupWork,
  MdAccessTime,
  MdAssignment,
  MdMarkEmailUnread,
  MdBarChart,
  MdFolderOpen,
  MdChat,
  MdSettings,
  MdVideocam
} from 'react-icons/md';

const routes = [
  {
    name: 'Panel Propietario',
    layout: '/admin',
    path: 'propietario',
    icon: <MdHome className="h-5 w-5" />,
  },
  {
    name: 'Panel Jefe',
    layout: '/admin',
    path: 'jefe',
    icon: <MdHome className="h-5 w-5" />,
  },
  {
    name: 'Empleados',
    layout: '/admin',
    path: 'empleados',
    icon: <MdPeople className="h-5 w-5" />,
    secondary: true,
  },
  {
    name: 'Equipos',
    layout: '/admin',
    icon: <MdGroupWork className="h-5 w-5" />,
    path: 'equipos',
  },
  {
    name: 'Asistencias',
    layout: '/admin',
    icon: <MdAccessTime className="h-5 w-5" />,
    path: 'asistencias',
  },
  {
    name: 'Tareas',
    layout: '/admin',
    path: 'tareas',
    icon: <MdAssignment className="h-5 w-5" />,
  },
  {
    name: 'Solicitudes',
    layout: '/admin',
    path: 'solicitudes',
    icon: <MdMarkEmailUnread className="h-5 w-5" />,
  },
  {
    name: 'Reportes',
    layout: '/admin',
    path: 'reportes',
    icon: <MdBarChart className="h-5 w-5" />,
  },
  {
    name: 'Documentos',
    layout: '/admin',
    path: 'documentos',
    icon: <MdFolderOpen className="h-5 w-5" />,
  },
  {
    name: 'Comunicación',
    layout: '/admin',
    path: 'comunicacion',
    icon: <MdChat className="h-5 w-5" />,
  },
  {
    name: 'Mensajería',
    layout: '/admin',
    path: 'mensajeria',
    icon: <MdChat className="h-5 w-5" />,
  },
  {
    name: 'Reuniones',
    layout: '/admin',
    path: 'reuniones',
    icon: <MdVideocam className="h-5 w-5" />,
  },
  {
    name: 'Ajustes',
    layout: '/admin',
    path: 'ajustes',
    icon: <MdSettings className="h-5 w-5" />,
  }
];
export default routes;
