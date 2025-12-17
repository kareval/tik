import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { LogIn, ShieldCheck, Mail, Lock, UserPlus, User } from 'lucide-react';
import { RoleDefinition, UserProfile } from '../types';

export const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState(''); // Only for signup
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // LOGIN FLOW
                await signInWithEmailAndPassword(auth, email, password);
                navigate('/');
            } else {
                // SIGNUP FLOW (Claim Invite)

                // 1. Create Auth User
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const uid = userCredential.user.uid;

                // 2. Check for Invites
                const invitesRef = collection(db, 'user_invites');
                const q = query(invitesRef, where('email', '==', email));
                const inviteSnapshot = await getDocs(q);

                let roleId = 'subcontractor'; // Default fallback (or 'guest')
                let managerEmail = undefined;
                let finalDisplayName = displayName;

                if (!inviteSnapshot.empty) {
                    // Invite Found! Claim it.
                    const inviteDoc = inviteSnapshot.docs[0];
                    const inviteData = inviteDoc.data();

                    roleId = inviteData.roleId || roleId;
                    managerEmail = inviteData.managerEmail;
                    // Use invite name if user didn't provide one, or overwrite? 
                    // Let's prefer the user's input, fallback to invite.
                    if (!finalDisplayName && inviteData.displayName) {
                        finalDisplayName = inviteData.displayName;
                    }

                    // Delete invite to prevent re-use
                    await deleteDoc(inviteDoc.ref);
                } else {
                    // No invite found. 
                    // Option A: Deny signup (Strict Mode) -> throw new Error('Solo usuarios invitados.')
                    // Option B: Allow as Guest (Permissive) -> We stick to this for now.
                    roleId = ''; // No role = Guest
                }

                // 3. Create Firestore Profile
                const profile: UserProfile = {
                    uid: uid,
                    email: email,
                    displayName: finalDisplayName,
                    roleId: roleId,
                    managerEmail: managerEmail
                };

                await setDoc(doc(db, 'users', uid), profile);
                navigate('/');
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este email ya está registrado. Intenta iniciar sesión.');
            } else {
                setError('Error de autenticación: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSetupAdmin = async () => {
        // Helper to seed the DB with roles and a default admin
        setLoading(true);
        try {
            // 1. Create Roles
            const roles: RoleDefinition[] = [
                { id: 'admin', name: 'Administrador', allowedPaths: ['/', '/projects', '/timesheets', '/financials', '/resources', '/reports', '/insights', '/settings', '/admin/users', '/admin/roles'], description: 'Acceso total y configuración' },
                { id: 'project_manager', name: 'Jefe de Proyecto', allowedPaths: ['/', '/projects', '/timesheets', '/resources', '/reports'], description: 'Gestión de proyectos, recursos y aprobaciones' },
                { id: 'director', name: 'Dirección', allowedPaths: ['/', '/projects', '/financials', '/reports', '/insights', '/resources'], description: 'Visión global y financiera' },
                { id: 'subcontractor', name: 'Colaborador', allowedPaths: ['/timesheets'], description: 'Imputación de horas' }
            ];

            for (const role of roles) {
                await setDoc(doc(db, 'roles', role.id), role);
            }

            // 2. Create Admin User (if not exists)
            const adminEmail = 'admin@hourcontrol.com';
            const adminPass = 'admin123';

            let userCredential;
            try {
                userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
            } catch (e) {
                userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
            }

            // 3. Create/Update Admin Profile in Firestore
            if (userCredential.user) {
                const profile: UserProfile = {
                    uid: userCredential.user.uid,
                    email: adminEmail,
                    displayName: 'Admin Sistema',
                    roleId: 'admin'
                };
                await setDoc(doc(db, 'users', userCredential.user.uid), profile);
            }

            alert(`Sistema Inicializado.\nUsuario: ${adminEmail}\nContraseña: ${adminPass}`);
            // Auto login implies we are now signed in
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError('Error inicializando sistema: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-white p-8 text-center flex flex-col items-center justify-center border-b border-gray-100">
                    <img src="/sapimsa-logo-new.png" alt="SAPIMSA" className="h-24 object-contain mb-2" />
                    <p className="text-gray-600 font-medium">Gestión Inteligente de Proyectos</p>
                </div>

                <div className="p-8">
                    <div className="flex border-b border-slate-100 dark:border-slate-700 mb-6">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 pb-2 text-sm font-bold transition-colors ${isLogin ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 pb-2 text-sm font-bold transition-colors ${!isLogin ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Registrarse
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                        {isLogin ? 'Bienvenido de nuevo' : 'Crear Cuenta'}
                    </h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required={!isLogin}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-white"
                                        placeholder="Tu Nombre"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-white"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-white"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 transform active:scale-95"
                        >
                            {loading ? 'Cargando...' : isLogin ? <><LogIn size={20} /> Entrar</> : <><UserPlus size={20} /> Crear Cuenta</>}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                        <button
                            onClick={handleSetupAdmin}
                            className="text-xs text-slate-400 hover:text-brand-600 underline"
                        >
                            (Dev) Inicializar Base de Datos y Admin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
