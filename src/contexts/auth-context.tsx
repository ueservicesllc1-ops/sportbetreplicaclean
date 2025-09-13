

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
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface UserProfile {
    uid: string;
    email: string | null;
    balance: number;
    shortId: string;
    verificationStatus: VerificationStatus;
    realName?: string;
    idNumber?: string;
    idPhotoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Temporarily make all logged-in users admin
        setIsAdmin(true);

        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setUserProfile(doc.data() as UserProfile);
            }
        });

        // Ensure user wallet/profile exists
        await createUserWallet(user);

        return () => unsubscribeProfile();

      } else {
        setIsAdmin(false);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createUserWallet = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      const shortId = generateShortId();
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        balance: 100, // Starting balance
        createdAt: serverTimestamp(),
        shortId: shortId,
        verificationStatus: 'unverified',
        realName: '',
        idNumber: '',
        idPhotoUrl: '',
      });
      toast({ title: '¡Bienvenido!', description: `Te hemos dado $100 para empezar. Tu ID de usuario es ${shortId}` });
    } else {
        // This is for users that existed before the shortId or verification feature
        const data = userDoc.data();
        const updates: any = {};
        if (!data.shortId) {
            updates.shortId = generateShortId();
        }
        if (!data.verificationStatus) {
            updates.verificationStatus = 'unverified';
        }
        if (Object.keys(updates).length > 0) {
            await updateDoc(userDocRef, updates);
        }
    }
  };

  const signUp = async (values: AuthFormValues) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await createUserWallet(userCredential.user);
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
      await createUserWallet(userCredential.user);
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
      await createUserWallet(userCredential.user);
      toast({ title: '¡Inicio de sesión exitoso!', description: 'Bienvenido.' });
    } catch (error: any)
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
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
