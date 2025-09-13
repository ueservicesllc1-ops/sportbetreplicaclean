
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addBanner } from '../actions';

export function AddBannerForm() {
  return (
    <form action={addBanner} className="space-y-6">
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
