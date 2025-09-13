
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addBanner } from '../actions';
import { revalidatePath } from 'next/cache';

export async function AddBannerForm() {

  async function handleAddBanner(formData: FormData) {
    'use server';
    try {
      await addBanner(formData);
      revalidatePath('/admin/banners');
    } catch (error) {
      console.error(error);
      // In a real app, you'd want to return this error to the user.
      // For now, we log it to the server console.
    }
  }

  return (
    <form action={handleAddBanner} className="space-y-6">
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
        <Label htmlFor="image">Imagen del Banner</Label>
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/png, image/jpeg, image/webp"
          required
        />
         <p className="text-xs text-muted-foreground pt-1">
            Sube la imagen para el banner. Recomendado: 1200x400px.
        </p>
      </div>

      <Button type="submit" className="w-full">
        Añadir Banner
      </Button>
    </form>
  );
}
