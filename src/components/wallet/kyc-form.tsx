
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldQuestion, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { getSignedUploadUrl, updateUserVerification } from '@/app/wallet/actions';
import Image from 'next/image';

const kycSchema = z.object({
  realName: z.string().min(3, { message: 'Por favor, introduce tu nombre completo.' }),
  idNumber: z.string().min(5, { message: 'Por favor, introduce un número de ID válido.' }),
  idPhoto: z.any().refine(file => file instanceof File, 'Por favor, sube una imagen.'),
});

type KycFormValues = z.infer<typeof kycSchema>;

export function KycForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      realName: '',
      idNumber: '',
      idPhoto: null,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('idPhoto', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const onSubmit = async (values: KycFormValues) => {
    setLoading(true);
    setError(null);

    try {
        // 1. Get signed URL for upload
        const { url, filePath } = await getSignedUploadUrl(values.idPhoto.type, values.idPhoto.name);
        
        // 2. Upload file to Google Cloud Storage
        const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: values.idPhoto,
            headers: { 'Content-Type': values.idPhoto.type }
        });

        if(!uploadResponse.ok) {
            throw new Error('No se pudo subir la imagen.');
        }

        // 3. Update user profile in Firestore
        await updateUserVerification({
            realName: values.realName,
            idNumber: values.idNumber,
            idPhotoPath: filePath,
        });

      toast({
        title: '¡Documentos enviados!',
        description: 'Hemos recibido tus documentos y los estamos revisando.',
      });
      // The parent component will re-render and show the 'pending' status
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
      toast({
        variant: 'destructive',
        title: 'Error al enviar',
        description: err.message || 'No se pudieron enviar tus documentos.',
      });
    } finally {
      setLoading(false);
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="realName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Tu nombre como aparece en tu ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Cédula o Pasaporte</FormLabel>
                <FormControl>
                  <Input placeholder="Tu número de identificación" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="idPhoto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Foto de tu ID</FormLabel>
                <FormControl>
                     <div className="relative flex justify-center items-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                        <Input
                            id="id-photo-upload"
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                        {preview ? (
                            <Image src={preview} alt="ID preview" layout="fill" objectFit="contain" className="rounded-lg" />
                        ) : (
                            <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
                                <Upload className="h-6 w-6" />
                                <p className="text-sm">Arrastra o haz clic para subir</p>
                                <p className="text-xs">PNG, JPG, WEBP (max 5MB)</p>
                            </div>
                        )}
                    </div>
                </FormControl>
                 <FormDescription>
                    Asegúrate de que la imagen sea clara y legible.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar para Verificación
          </Button>
        </form>
      </Form>
    </div>
  );
}
