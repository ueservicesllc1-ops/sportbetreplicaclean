
'use client';

import { useActionState } from 'react';
import { useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addBanner } from '../actions';

const initialState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Añadir Banner
    </Button>
  );
}

export function AddBannerForm() {
  const [state, formAction] = useActionState(addBanner, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: '¡Éxito!',
          description: state.message,
        });
        formRef.current?.reset();
      } else {
        // The error is shown in the Alert component, no need for a toast.
      }
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL de la Imagen</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          type="url"
          placeholder="https://ejemplo.com/imagen.jpg"
          required
        />
         <p className="text-xs text-muted-foreground">
          Sube tu imagen a un servicio como postimages.org y pega la URL aquí.
        </p>
      </div>

      {!state.success && state.message && (
        <Alert variant="destructive">
          <AlertTitle>Error al añadir banner</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <SubmitButton />
    </form>
  );
}
