export type IconName =
  | 'activity'
  | 'ai'
  | 'analytics'
  | 'automation'
  | 'briefcase'
  | 'building'
  | 'chart'
  | 'check'
  | 'clock'
  | 'command'
  | 'database'
  | 'file'
  | 'lock'
  | 'message'
  | 'payroll'
  | 'shield'
  | 'spark'
  | 'users'
  | 'workflow'
  | 'zap';

export const iconPaths: Record<IconName, string[]> = {
  activity: ['M22 12h-4l-3 8-6-16-3 8H2'],
  ai: ['M12 2l1.6 5.2L19 8.8l-5.4 1.6L12 16l-1.6-5.6L5 8.8l5.4-1.6L12 2z', 'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z'],
  analytics: ['M4 19V5', 'M4 19h16', 'M8 16v-5', 'M12 16V8', 'M16 16v-8'],
  automation: ['M4 12a8 8 0 0114.8-4.2', 'M20 4v5h-5', 'M20 12a8 8 0 01-14.8 4.2', 'M4 20v-5h5'],
  briefcase: ['M10 6V5a2 2 0 012-2h0a2 2 0 012 2v1', 'M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z', 'M3 13h18'],
  building: ['M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16', 'M16 9h2a2 2 0 012 2v10', 'M8 7h4', 'M8 11h4', 'M8 15h4'],
  chart: ['M4 19V5', 'M4 19h16', 'M7 15l4-4 3 3 5-7'],
  check: ['M20 6L9 17l-5-5'],
  clock: ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M12 6v6l4 2'],
  command: ['M8 8H6a3 3 0 110-6 3 3 0 013 3v14a3 3 0 11-3-3h12a3 3 0 113 3 3 3 0 01-3-3V5a3 3 0 113 3H6'],
  database: ['M4 6c0-2 16-2 16 0s-16 2-16 0z', 'M4 6v6c0 2 16 2 16 0V6', 'M4 12v6c0 2 16 2 16 0v-6'],
  file: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M8 13h8', 'M8 17h6'],
  lock: ['M7 11V8a5 5 0 0110 0v3', 'M5 11h14v10H5z'],
  message: ['M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z'],
  payroll: ['M4 7h16v10H4z', 'M8 11h8', 'M8 15h4', 'M17 7V5', 'M7 7V5'],
  shield: ['M12 2l8 4v6c0 5-3.3 8.6-8 10-4.7-1.4-8-5-8-10V6l8-4z', 'M9 12l2 2 4-5'],
  spark: ['M13 2L3 14h8l-1 8 10-12h-8l1-8z'],
  users: ['M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M22 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  workflow: ['M6 4a2 2 0 100 4 2 2 0 000-4z', 'M18 16a2 2 0 100 4 2 2 0 000-4z', 'M6 8v3a3 3 0 003 3h6a3 3 0 013 3v-1', 'M18 4v6', 'M15 7h6'],
  zap: ['M13 2L3 14h8l-1 8 10-12h-8l1-8z'],
};
