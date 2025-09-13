
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useRef, useState } from 'react';
import { addBanner } from '../actions';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

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
  const [state, formAction] = useFormState(addBanner, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: '¡Banner añadido!',
          description: state.message,
        });
        formRef.current?.reset();
        setPreview(null);
      } else {
        // El error se mostrará en el componente Alert de abajo
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
    } else {
      setPreview(null);
    }
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Título del Banner</Label>
        <Input
          id="title"
          name="title"
          placeholder="Ej: Bono de Bienvenida"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="image">Imagen del Banner</Label>
        <div className="relative flex justify-center items-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
          <Input
            id="image"
            name="image"
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            required
          />
          {preview ? (
            <Image src={preview} alt="Banner preview" fill objectFit="contain" className="rounded-lg p-2" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
              <Upload className="h-6 w-6" />
              <p className="text-sm">Arrastra o haz clic para subir</p>
              <p className="text-xs">PNG, JPG, WEBP (max 4MB)</p>
            </div>
          )}
        </div>
      </div>

      {state.message && !state.success && (
        <Alert variant="destructive">
          <AlertTitle>Error al añadir banner</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      
      <SubmitButton />
    </form>
  );
}
