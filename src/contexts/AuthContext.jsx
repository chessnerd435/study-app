import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase';
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch or create user document in Firestore
    async function fetchUserData(firebaseUser) {
        if (!firebaseUser) {
            setUserData(null);
            return;
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            setUserData(userSnap.data());
            // Update last active
            await updateDoc(userRef, { lastActive: new Date() });
        } else {
            // Create new user document
            const newUserData = {
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Learner',
                email: firebaseUser.email,
                xp: 0,
                streak: 0,
                lastActive: new Date(),
                quizzesCreated: 0,
                quizzesCompleted: 0,
                createdAt: new Date()
            };
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            await fetchUserData(firebaseUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    };

    const loginWithEmail = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    };

    const signupWithEmail = async (email, password) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    };

    const logout = () => signOut(auth);

    const addXP = async (amount) => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        const newXP = (userData?.xp || 0) + amount;
        await updateDoc(userRef, { xp: newXP });
        setUserData(prev => ({ ...prev, xp: newXP }));
    };

    const value = {
        user,
        userData,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        addXP,
        refreshUserData: () => fetchUserData(user)
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
