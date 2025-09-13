
'use client';

import { useEffect, useRef, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldQuestion, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { updateUserVerification } from '@/app/wallet/actions';
import Image from 'next/image';
import { Label } from '../ui/label';
import { useAuth } from '@/contexts/auth-context';


const initialState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Enviar para Verificación
    </Button>
  );
}


export function KycForm() {
  const { user } = useAuth();
  const [state, formAction] = useActionState(updateUserVerification, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

   useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: '¡Documentos enviados!',
          description: state.message,
        });
        formRef.current?.reset();
        setPreview(null);
        // The parent component will re-render and show the 'pending' status due to revalidation
      } else {
        toast({
            variant: 'destructive',
            title: 'Error al enviar',
            description: state.message,
        });
      }
    }
  }, [state, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="space-y-4">
      <Alert>
        <ShieldQuestion className="h-4 w-4" />
        <AlertTitle>Verificación de Identidad Requerida</AlertTitle>
        <AlertDescription>
          Para cumplir con las regulaciones, necesitamos verificar tu identidad antes de que puedas depositar o retirar fondos. Este es un proceso único.
        </AlertDescription>
      </Alert>

      <form ref={formRef} action={formAction} className="space-y-6">
        {/* Pass user ID to the server action */}
        <input type="hidden" name="uid" value={user?.uid} />
        
        <div className="space-y-2">
            <Label htmlFor="realName">Nombre Completo</Label>
            <Input id="realName" name="realName" placeholder="Tu nombre como aparece en tu ID" required minLength={3} />
        </div>

        <div className="space-y-2">
            <Label htmlFor="idNumber">Número de Cédula o Pasaporte</Label>
            <Input id="idNumber" name="idNumber" placeholder="Tu número de identificación" required minLength={5} />
        </div>

        <div className="space-y-2">
            <Label>Foto de tu ID</Label>
            <div className="relative flex justify-center items-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <Input
                    id="idPhoto"
                    name="idPhoto"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    required
                />
                {preview ? (
                    <Image src={preview} alt="ID preview" fill objectFit="contain" className="rounded-lg" />
                ) : (
                    <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <p className="text-sm">Arrastra o haz clic para subir</p>
                        <p className="text-xs">PNG, JPG, WEBP (max 4MB)</p>
                    </div>
                )}
            </div>
            <FormDescription className="text-xs px-1">
                Asegúrate de que la imagen sea clara y legible.
            </FormDescription>
        </div>
        
        {state.message && !state.success && (
            <Alert variant="destructive">
            <AlertTitle>Error Detallado</AlertTitle>
            <AlertDescription className="break-all">
                {state.message}
            </AlertDescription>
            </Alert>
        )}
          
        <SubmitButton />
      </form>
    </div>
  );
}
