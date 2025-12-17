import React, { useReducer, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TimeSheet } from './pages/TimeSheet';
import { Financials } from './pages/Financials';
import { Resources } from './pages/Resources';
import { Projects } from './pages/Projects';
import { Reports } from './pages/Reports';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { AuthCallback } from './pages/AuthCallback';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UsersPage } from './pages/admin/Users';
import { RolesPage } from './pages/admin/Roles';
import { AppState, Action, Role, Status, Notification } from './types';
import { MOCK_PROJECTS, MOCK_SUBCONTRACTORS, MOCK_TIMELOGS, MOCK_INVOICES, MOCK_NOTIFICATIONS } from './constants';
import { subscribeToCollection, addItem, updateItem, deleteItem } from './services/firestore';

const initialState: AppState = {
  theme: 'light',
  currentUserRole: Role.PROJECT_MANAGER,
  currentUserEmail: 'manager@example.com',
  projects: [],
  subcontractors: [],
  timeLogs: [],
  invoices: [],
  notifications: MOCK_NOTIFICATIONS,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'SET_ROLE':
      return { ...state, currentUserRole: action.payload };
    case 'SET_CURRENT_USER_EMAIL':
      return { ...state, currentUserEmail: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_SUBCONTRACTORS':
      return { ...state, subcontractors: action.payload };
    case 'SET_TIMELOGS':
      return { ...state, timeLogs: action.payload };
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    case 'MARK_NOTIFICATION_READ':
      return { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n) };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    default:
      return state;
  }
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { userProfile, role } = useAuth();

  // Firestore Subscriptions
  useEffect(() => {
    const unsubProjects = subscribeToCollection('projects', (data: any[]) => dispatch({ type: 'SET_PROJECTS', payload: data }));
    const unsubSubs = subscribeToCollection('subcontractors', (data: any[]) => dispatch({ type: 'SET_SUBCONTRACTORS', payload: data }));
    const unsubLogs = subscribeToCollection('timeLogs', (data: any[]) => dispatch({ type: 'SET_TIMELOGS', payload: data }));
    const unsubInvoices = subscribeToCollection('invoices', (data: any[]) => dispatch({ type: 'SET_INVOICES', payload: data }));

    return () => {
      unsubProjects();
      unsubSubs();
      unsubLogs();
      unsubInvoices();
    };
  }, []);

  // Sync Auth User with App State
  useEffect(() => {
    if (userProfile?.email && userProfile.email !== state.currentUserEmail) {
      dispatch({ type: 'SET_CURRENT_USER_EMAIL', payload: userProfile.email });
    }
    if (role) {
      const mappedRole = Object.values(Role).find(r => r === role.id.toUpperCase()) as Role;
      if (mappedRole && mappedRole !== state.currentUserRole) {
        dispatch({ type: 'SET_ROLE', payload: mappedRole });
      }
    }
  }, [userProfile, role, state.currentUserEmail, state.currentUserRole]);

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  const asyncDispatch = async (action: Action) => {
    dispatch(action);

    try {
      switch (action.type) {
        case 'ADD_TIMELOG':
          await addItem('timeLogs', action.payload);
          break;
        case 'BATCH_ADD_TIMELOGS':
          action.payload.forEach(log => addItem('timeLogs', log));
          break;
        case 'UPDATE_TIMELOG_STATUS':
          await updateItem('timeLogs', action.payload.id, { status: action.payload.status });
          break;
        case 'ADD_PROJECT':
          await addItem('projects', action.payload);
          break;
        case 'UPDATE_PROJECT':
          await updateItem('projects', action.payload.id, action.payload);
          break;
        case 'ADD_SUBCONTRACTOR':
          await addItem('subcontractors', action.payload);
          break;
        case 'UPDATE_SUBCONTRACTOR':
          await updateItem('subcontractors', action.payload.id, action.payload);
          break;
        case 'ADD_INVOICE':
          await addItem('invoices', action.payload);
          break;
        case 'UPDATE_INVOICE_STATUS':
          await updateItem('invoices', action.payload.id, { status: action.payload.status });
          break;
      }
    } catch (error) {
      console.error("Error writing to Firestore:", error);
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout state={state} dispatch={asyncDispatch} onRoleChange={(r) => dispatch({ type: 'SET_ROLE', payload: r })}>
            <Routes>
              <Route path="/" element={<Dashboard state={state} />} />
              <Route path="/projects/*" element={<Projects state={state} dispatch={asyncDispatch} />} />
              <Route path="/timesheets" element={<TimeSheet state={state} dispatch={asyncDispatch} />} />
              <Route path="/financials" element={<Financials state={state} dispatch={asyncDispatch} />} />
              <Route path="/resources" element={<Resources state={state} dispatch={asyncDispatch} />} />
              <Route path="/reports" element={<Reports state={state} />} />
              <Route path="/insights" element={<Insights state={state} />} />
              <Route path="/settings" element={<Settings state={state} />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/roles" element={<RolesPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;