insert into public.planes (nombre, precio, limites) values
(
  'Starter',
  20,
  '{
    "annual": 144,
    "description": "Operación esencial para empleados, tareas, asistencia y solicitudes básicas.",
    "limits": {"employees": 15, "departments": 3, "branches": 1, "storageGb": 5, "aiRequestsMonthly": 0},
    "features": {"employees": true, "tasks": true, "attendance": true, "reports": false, "payroll": false, "requests": true, "documents": false, "incidents": true, "inventory": false, "internalChat": false, "ai": false, "metrics": false, "leaders": false, "exports": false, "superAdmin": false, "customBranding": false}
  }'::jsonb
),
(
  'Business',
  50,
  '{
    "annual": 360,
    "description": "RR. HH. completo con reportes, nómina, documentos, chat interno, IA y jefaturas.",
    "limits": {"employees": 100, "departments": 25, "branches": 10, "storageGb": 60, "aiRequestsMonthly": 1500},
    "features": {"employees": true, "tasks": true, "attendance": true, "reports": true, "payroll": true, "requests": true, "documents": true, "incidents": true, "inventory": true, "internalChat": true, "ai": true, "metrics": true, "leaders": true, "exports": true, "superAdmin": false, "customBranding": true}
  }'::jsonb
),
(
  'Enterprise',
  200,
  '{
    "annual": 1440,
    "description": "Escala corporativa con límites abiertos, super admin, auditoría avanzada y personalización.",
    "limits": {"employees": null, "departments": null, "branches": null, "storageGb": 500, "aiRequestsMonthly": 15000},
    "features": {"employees": true, "tasks": true, "attendance": true, "reports": true, "payroll": true, "requests": true, "documents": true, "incidents": true, "inventory": true, "internalChat": true, "ai": true, "metrics": true, "leaders": true, "exports": true, "superAdmin": true, "customBranding": true}
  }'::jsonb
);
