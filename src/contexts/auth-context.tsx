

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { AuthFormValues } from '@/components/auth/auth-form';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, updateDoc } from 'firebase/firestore';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type UserRole = 'user' | 'admin' | 'superadmin';


export interface UserProfile {
    uid: string;
    email: string | null;
    balance: number;
    shortId: string;
    verificationStatus: VerificationStatus;
    role: UserRole;
    realName?: string;
    idNumber?: string;
    idPhotoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean; // True if 'admin' or 'superadmin'
  isSuperAdmin: boolean;
  signUp: (values: AuthFormValues) => Promise<void>;
  signIn: (values: AuthFormValues) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateShortId(): string {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters[Math.floor(Math.random() * letters.length)];
    return `${numbers}${letter}`;
}

const SUPER_ADMINS = ['dev@sportbet.com', 'ypueservicesllc1@gmail.com'];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userIsSuperAdmin = SUPER_ADMINS.includes(user.email || '');

        // We will set admin status based on the profile data from firestore
        await createUserProfile(user); 

        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const profile = doc.data() as UserProfile;
                setUserProfile(profile);

                const isUserAdmin = profile.role === 'admin' || profile.role === 'superadmin';
                const isProfileSuperAdmin = profile.role === 'superadmin';

                setIsAdmin(isUserAdmin || userIsSuperAdmin);
                setIsSuperAdmin(isProfileSuperAdmin || userIsSuperAdmin);

            } else {
                 setUserProfile(null);
                 setIsAdmin(userIsSuperAdmin);
                 setIsSuperAdmin(userIsSuperAdmin);
            }
            setLoading(false);
        });

        return () => unsubscribeProfile();

      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const createUserProfile = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const role: UserRole = SUPER_ADMINS.includes(user.email || '') ? 'superadmin' : 'user';
    
    if (!userDoc.exists()) {
      try {
        const shortId = generateShortId();
        
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            balance: 100, // Saldo inicial
            createdAt: serverTimestamp(),
            shortId: shortId,
            verificationStatus: 'unverified',
            role: role, // Default role for new users
            realName: '',
            idNumber: '',
            idPhotoUrl: '',
        });
        toast({ title: '¡Bienvenido!', description: `Te hemos dado $100 para empezar. Tu ID de usuario es ${shortId}` });
      } catch (error) {
        console.error("Error creating user profile:", error);
      }
    } else {
        const data = userDoc.data();
        const updates: Partial<UserProfile> = {};
        if (!data.shortId) updates.shortId = generateShortId();
        if (!data.verificationStatus) updates.verificationStatus = 'unverified';
        
        // Ensure superadmins always have the correct role
        const expectedRole = SUPER_ADMINS.includes(data.email || '') ? 'superadmin' : (data.role || 'user');
        if (data.role !== expectedRole) {
            updates.role = expectedRole;
        }


        if (Object.keys(updates).length > 0) {
            await updateDoc(userDocRef, updates);
        }
    }
  };

  const signUp = async (values: AuthFormValues) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await createUserProfile(userCredential.user);
      toast({ title: '¡Registro exitoso!', description: 'Bienvenido.' });
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        variant: 'destructive',
        title: 'Error en el registro',
        description: error.message,
      });
      throw error;
    }
  };

  const signIn = async (values: AuthFormValues) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await createUserProfile(userCredential.user);
      toast({ title: '¡Inicio de sesión exitoso!', description: 'Bienvenido de vuelta.' });
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: 'Credenciales incorrectas. Por favor, inténtalo de nuevo.',
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await createUserProfile(userCredential.user);
      toast({ title: '¡Inicio de sesión exitoso!', description: 'Bienvenido.' });
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({
        variant: 'destructive',
        title: 'Error con Google',
        description: 'No se pudo iniciar sesión con Google.',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: 'Has cerrado sesión.' });
    } catch (error: any) {
       console.error('Error signing out:', error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cerrar la sesión.',
      });
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    isAdmin,
    isSuperAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
