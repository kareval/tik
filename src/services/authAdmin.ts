import { initializeApp, getApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../firebase'; // Import config from your existing file

// Helper to create a user without logging out the current admin
export const createUserForTesting = async (email: string, pass: string): Promise<string> => {
    let secondApp: FirebaseApp | undefined;
    const appName = 'secondaryAppForUserCreation';

    try {
        // 1. Initialize a secondary app instance
        // Check if it already exists to avoid errors, though we try to delete it at the end
        const existingApps = getApps();
        const foundApp = existingApps.find(app => app.name === appName);

        if (foundApp) {
            secondApp = foundApp;
        } else {
            secondApp = initializeApp(firebaseConfig, appName);
        }

        const secondAuth = getAuth(secondApp);

        // 2. Create the user on this secondary instance
        const userCredential = await createUserWithEmailAndPassword(secondAuth, email, pass);
        const uid = userCredential.user.uid;

        // 3. Sign out immediately from this secondary instance to be safe
        await signOut(secondAuth);

        return uid;

    } catch (error) {
        console.error("Error creating user in secondary app:", error);
        throw error;
    } finally {
        // 4. Cleanup: Delete the secondary app instance to free resources
        if (secondApp) {
            try {
                await deleteApp(secondApp);
            } catch (e) {
                console.warn("Error deleting secondary app:", e);
            }
        }
    }
};
