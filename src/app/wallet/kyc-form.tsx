
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, ShieldQuestion, Upload } from 'lucide-react';
import { updateUserVerification } from '@/app/wallet/actions';
import Image from 'next/image';

const initialState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Enviar para Verificación
    </Button>
  );
}

export function KycForm() {
  const { user } = useAuth();
  const [state, formAction] = useActionState(updateUserVerification, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  useEffect(() => {
    if (state.success) {
      // El estado de pendiente/verificado se mostrará automáticamente
      // al refrescar el perfil de usuario en el AuthContext.
      // No necesitamos hacer nada aquí.
    }
  }, [state]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-3">
            <ShieldQuestion className="h-6 w-6 text-primary" />
            <div>
                <h3 className="font-semibold text-lg">Verifica tu Identidad</h3>
                <p className="text-sm text-muted-foreground">Para habilitar los depósitos y retiros, necesitamos confirmar tu identidad.</p>
            </div>
        </div>

        <form ref={formRef} action={formAction} className="space-y-6">
            <input type="hidden" name="uid" value={user?.uid} />
            <div className="space-y-2">
                <Label htmlFor="realName">Nombre Completo (como en tu cédula)</Label>
                <Input id="realName" name="realName" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="idNumber">Número de Cédula</Label>
                <Input id="idNumber" name="idNumber" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="idPhoto">Foto de tu Cédula (lado frontal)</Label>
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
                        <Image src={preview} alt="ID preview" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain rounded-lg p-2" />
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <p className="text-sm">Arrastra o haz clic para subir</p>
                        </div>
                    )}
                </div>
            </div>

            {state.message && !state.success && (
                <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}
             
            <SubmitButton />
        </form>
    </div>
  );
}
