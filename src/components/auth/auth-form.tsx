
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { DialogClose } from '../ui/dialog';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export type AuthFormValues = z.infer<typeof formSchema>;

export function AuthForm() {
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, signInWithGoogle } = useAuth();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setLoading(true);
    try {
      if (activeTab === 'signup') {
        await signUp(values);
      } else {
        await signIn(values);
      }
      // The dialog will close automatically if the form is inside a DialogClose trigger,
      // or we can manage a state in the parent to close it.
      // For simplicity, we can wrap the submit button in DialogClose
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
        await signInWithGoogle();
    } catch (error) {
        // Error handled in context
    } finally {
        setLoading(false);
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Acceder</TabsTrigger>
        <TabsTrigger value="signup">Registrarse</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <AuthCard
          buttonText="Acceder"
          form={form}
          onSubmit={onSubmit}
          loading={loading}
          onGoogleSignIn={handleGoogleSignIn}
        />
      </TabsContent>
      <TabsContent value="signup">
        <AuthCard
          buttonText="Registrarse"
          form={form}
          onSubmit={onSubmit}
          loading={loading}
          onGoogleSignIn={handleGoogleSignIn}
        />
      </TabsContent>
    </Tabs>
  );
}

interface AuthCardProps {
  buttonText: string;
  form: any;
  onSubmit: (values: AuthFormValues) => void;
  loading: boolean;
  onGoogleSignIn: () => void;
}

function AuthCard({
  buttonText,
  form,
  onSubmit,
  loading,
  onGoogleSignIn,
}: AuthCardProps) {
  return (
    <Card className="border-0 shadow-none">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col gap-4">
             <DialogClose asChild>
                <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {buttonText}
                </Button>
            </DialogClose>
            <Button variant="outline" className="w-full" onClick={onGoogleSignIn} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 173.4 56.4l-64.3 64.3c-35.3-32.5-83.3-52.1-138.5-52.1-105.9 0-191.9 86-191.9 191.9s86 191.9 191.9 191.9c60.3 0 112.3-24.8 148.8-63.5-38.1-27.1-65-68.5-65-118.9 0-2.3.1-4.6.3-6.9H248v-85.3h236.1c2.3 12.7 3.9 25.9 3.9 39.4z"></path></svg>
                }
                Continuar con Google
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
