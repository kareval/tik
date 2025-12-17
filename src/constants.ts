import { Project, Subcontractor, TimeLog, Invoice, Status, Role, Notification } from './types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Migración Cloud Alpha',
    client: 'Banco Santander',
    budget: 150000,
    currency: 'EUR',
    managerId: 'pm1',
    assignments: [
      { subcontractorId: 's1', hoursCap: 160, period: 'monthly' },
      { subcontractorId: 's3', hoursCap: 80, period: 'total' }
    ]
  },
  {
    id: 'p2',
    name: 'App Móvil Retail',
    client: 'Inditex',
    budget: 85000,
    currency: 'EUR',
    managerId: 'pm2',
    assignments: [
      { subcontractorId: 's2', hoursCap: 120, period: 'monthly' }
    ]
  },
  {
    id: 'p3',
    name: 'Auditoría Ciberseguridad',
    client: 'Mapfre',
    budget: 45000,
    currency: 'EUR',
    managerId: 'pm1',
    assignments: [
      { subcontractorId: 's3', hoursCap: 40, period: 'total' },
      { subcontractorId: 's1', hoursCap: 20, period: 'monthly' }
    ]
  },
];

export const MOCK_SUBCONTRACTORS: Subcontractor[] = [
  { id: 's1', name: 'DevCorps Solutions', role: 'Backend Development', hourlyRate: 55, currency: 'EUR' },
  { id: 's2', name: 'Ana García (Freelance)', role: 'UX/UI Design', hourlyRate: 65, currency: 'EUR' },
  { id: 's3', name: 'Securitas Ops', role: 'DevSecOps', hourlyRate: 80, currency: 'EUR' },
];

export const MOCK_TIMELOGS: TimeLog[] = [
  { id: 't1', subcontractorId: 's1', projectId: 'p1', date: '2023-10-01', hours: 8, description: 'API Gateway setup', status: Status.RATIFIED_MGR },
  { id: 't2', subcontractorId: 's1', projectId: 'p1', date: '2023-10-02', hours: 8, description: 'Auth0 integration', status: Status.APPROVED_PM },
  { id: 't3', subcontractorId: 's2', projectId: 'p2', date: '2023-10-05', hours: 6, description: 'Wireframing Home Screen', status: Status.PENDING },
  { id: 't4', subcontractorId: 's3', projectId: 'p3', date: '2023-10-05', hours: 4, description: 'Vulnerability Scan', status: Status.PENDING },
  { id: 't5', subcontractorId: 's1', projectId: 'p1', date: '2023-10-03', hours: 8, description: 'Database migration scripts', status: Status.REJECTED, feedback: 'Overestimated hours for this task' },
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv1', subcontractorId: 's1', projectId: 'p1', period: '2023-09', amount: 8800, currency: 'EUR', status: Status.RATIFIED_MGR },
  { id: 'inv2', subcontractorId: 's2', projectId: 'p2', period: '2023-09', amount: 5200, currency: 'EUR', status: Status.APPROVED_PM },
  { id: 'inv3', subcontractorId: 's3', projectId: 'p3', period: '2023-09', amount: 3200, currency: 'EUR', status: Status.PENDING },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', recipientRole: Role.PROJECT_MANAGER, message: 'Ana García ha imputado 6h en App Móvil Retail.', type: 'info', read: false, timestamp: new Date().toISOString() },
  { id: 'n2', recipientRole: Role.DIRECTOR, message: 'Facturas de Septiembre listas para revisión.', type: 'warning', read: false, timestamp: new Date(Date.now() - 86400000).toISOString() },
];

export const MENU_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/projects', label: 'Proyectos' },
  { path: '/timesheets', label: 'Control de Horas' },
  { path: '/financials', label: 'Facturación' },
  { path: '/resources', label: 'Recursos' },
  { path: '/reports', label: 'Informes' },
  { path: '/insights', label: 'Insights AI' },
  { path: '/settings', label: 'Configuración' },
  { path: '/admin/users', label: 'Usuarios' },
  { path: '/admin/roles', label: 'Roles' }
];