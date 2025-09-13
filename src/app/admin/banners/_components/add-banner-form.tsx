
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { addBanner, uploadFileToStorage } from '../actions';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const bannerSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
  image: z.any().refine(file => file instanceof File, 'Por favor, sube una imagen.'),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

export function AddBannerForm() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: '',
      image: null,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const onSubmit = async (values: BannerFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', values.image);

      const { filePath } = await uploadFileToStorage(formData);
      
      if (!filePath) {
        throw new Error('La ruta del archivo no fue devuelta por el servidor.');
      }

      await addBanner({
        title: values.title,
        imagePath: filePath,
      });

      toast({
        title: '¡Banner añadido!',
        description: 'El nuevo banner aparecerá en la página de inicio.',
      });
      form.reset();
      setPreview(null);
    } catch (err: any) {
      const errorMessage = err.message || 'No se pudo guardar el banner.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error al añadir banner',
        description: 'Ha ocurrido un error. Revisa el mensaje en pantalla.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título del Banner</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Bono de Bienvenida" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={() => (
              <FormItem>
                <FormLabel>Imagen del Banner</FormLabel>
                <FormControl>
                     <div className="relative flex justify-center items-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                        <Input
                            id="image-upload"
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleFileChange}
                            disabled={loading}
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
      </Form>
  );
}
