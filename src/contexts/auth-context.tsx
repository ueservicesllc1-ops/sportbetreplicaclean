
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
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { AuthFormValues } from '@/components/auth/auth-form';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (values: AuthFormValues) => Promise<void>;
  signIn: (values: AuthFormValues) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (values: AuthFormValues) => {
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
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
      await signInWithEmailAndPassword(auth, values.email, values.password);
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
      await signInWithPopup(auth, provider);
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
    loading,
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
