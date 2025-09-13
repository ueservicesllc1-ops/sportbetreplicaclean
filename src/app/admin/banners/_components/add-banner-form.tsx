
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { addBanner } from '../actions';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export function AddBannerForm() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    const result = await addBanner(formData);

    if (result.success) {
      toast({
        title: '¡Banner añadido!',
        description: 'El nuevo banner aparecerá en la página de inicio.',
      });
      formRef.current?.reset();
      setPreview(null);
    } else {
      setError(result.message);
      toast({
        variant: 'destructive',
        title: 'Error al añadir banner',
        description: result.message,
      });
    }

    setLoading(false);
  };

  return (
      <form ref={formRef} action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
              <Label htmlFor="title">Título del Banner</Label>
              <Input 
                id="title"
                name="title"
                placeholder="Ej: Bono de Bienvenida"
                required 
                minLength={3}
              />
          </div>

          <div className="space-y-2">
            <Label>Imagen del Banner</Label>
            <div className="relative flex justify-center items-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <Input
                    ref={fileInputRef}
                    id="image"
                    name="image"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    disabled={loading}
                    required
                />
                {preview ? (
                    <Image src={preview} alt="Banner preview" layout="fill" objectFit="contain" className="rounded-lg" />
                ) : (
                    <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <p className="text-sm">Arrastra o haz clic para subir</p>
                        <p className="text-xs">Recomendado: 1200x400px</p>
                    </div>
                )}
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error Detallado</AlertTitle>
              <AlertDescription className="break-all">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Añadir Banner
          </Button>
      </form>
  );
}
