import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile, RoleDefinition } from '../types';

interface AuthContextType {
    user: FirebaseUser | null;
    userProfile: UserProfile | null;
    role: RoleDefinition | null;
    loading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    role: null,
    loading: true,
    isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [role, setRole] = useState<RoleDefinition | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    // Fetch User Profile
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const profile = userDoc.data() as UserProfile;
                        setUserProfile(profile);

                        // Fetch Role Definition
                        if (profile.roleId) {
                            const roleDocRef = doc(db, 'roles', profile.roleId);
                            const roleDoc = await getDoc(roleDocRef);
                            if (roleDoc.exists()) {
                                setRole(roleDoc.data() as RoleDefinition);
                            }
                        }
                    } else {
                        // If user exists in Auth but not in Firestore (e.g. first login or data issue)
                        // We can handle this by creating a default profile or letting the UI handle "No Profile"
                        console.warn("User authenticated but no profile found in 'users' collection.");
                        setUserProfile(null);
                        setRole(null);
                    }
                } catch (error) {
                    console.error("Error fetching user details:", error);
                }
            } else {
                setUser(null);
                setUserProfile(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, userProfile, role, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
