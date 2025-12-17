export enum Status {
  PENDING = 'PENDING',
  APPROVED_PM = 'APPROVED_PM',
  RATIFIED_MGR = 'RATIFIED_MGR',
  REJECTED = 'REJECTED'
}

export enum Role {
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DIRECTOR = 'DIRECTOR'
}

export type CapPeriod = 'monthly' | 'total';

export interface ProjectAssignment {
  subcontractorId: string;
  hoursCap: number;     // Límite de horas
  period: CapPeriod;    // 'monthly' (se reinicia cada mes) o 'total' (por proyecto)
}

export interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  currency: string;
  managerId: string;
  assignments: ProjectAssignment[]; // Nueva estructura de asignación
}

export interface Subcontractor {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
  currency: string;
  personnelNumber?: string;
  factorialId?: string;
  managerEmail?: string;
}

export interface TimeLog {
  id: string;
  subcontractorId: string;
  projectId: string;
  date: string;
  hours: number;
  description: string;
  status: Status;
  feedback?: string;
}

export interface Invoice {
  id: string;
  subcontractorId: string;
  projectId: string;
  period: string;
  amount: number;
  currency: string;
  status: Status;
  fileUrl?: string;
}

export interface Notification {
  id: string;
  recipientRole: Role;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  relatedId?: string;
}

export type Theme = 'light' | 'dark';

export interface AppState {
  theme: Theme;
  currentUserRole: Role;
  currentUserEmail?: string; // Simulated email for filtering
  projects: Project[];
  subcontractors: Subcontractor[];
  timeLogs: TimeLog[];
  invoices: Invoice[];
  notifications: Notification[];
}

export type Action =
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_ROLE'; payload: Role }
  | { type: 'SET_CURRENT_USER_EMAIL'; payload: string }
  | { type: 'UPDATE_TIMELOG_STATUS'; payload: { id: string; status: Status } }
  | { type: 'UPDATE_INVOICE_STATUS'; payload: { id: string; status: Status } }
  | { type: 'ADD_TIMELOG'; payload: TimeLog }
  | { type: 'BATCH_ADD_TIMELOGS'; payload: TimeLog[] }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'ADD_SUBCONTRACTOR'; payload: Subcontractor }
  | { type: 'UPDATE_SUBCONTRACTOR'; payload: Subcontractor }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project } // Nueva acción para guardar asignaciones
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'UPDATE_PROJECT_TEAM'; payload: { projectId: string; subcontractorIds: string[] } }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_SUBCONTRACTORS'; payload: Subcontractor[] }
  | { type: 'SET_TIMELOGS'; payload: TimeLog[] }
  | { type: 'SET_INVOICES'; payload: Invoice[] };

export interface RoleDefinition {
  id: string; // e.g. 'admin', 'pm'
  name: string; // Display name
  description?: string;
  allowedPaths: string[]; // List of routes: ['/projects', '/timesheet', ...]
  permissions?: string[]; // Granular permissions if needed e.g. 'can_approve_timesheet'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roleId: string; // Links to RoleDefinition.id
  photoURL?: string;
  managerEmail?: string; // If this user is a resource, who manages them?
}