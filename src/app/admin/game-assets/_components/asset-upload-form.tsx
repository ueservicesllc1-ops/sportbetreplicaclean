'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, ImageUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateGameAsset } from '../actions';

interface FormState {
  success: boolean;
  message: string;
}

const initialState: FormState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><ImageUp className="mr-2 h-4 w-4" /> Guardar Imagen</>}
    </Button>
  );
}

interface AssetUploadFormProps {
  assetKey: string;
  title: string;
  description: string;
  currentImageUrl: string | null;
}

export function AssetUploadForm({ assetKey, title, description, currentImageUrl }: AssetUploadFormProps) {
  const [state, formAction] = useActionState(updateGameAsset, initialState);
  const [preview, setPreview] = useState<string | null>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: '¡Éxito!', description: state.message });
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: state.message });
      }
    }
  }, [state, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else {
      setPreview(currentImageUrl); // Revert to original if no file is selected
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="assetKey" value={assetKey} />
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`image-${assetKey}`}>Imagen Actual</Label>
            <div className="relative flex justify-center items-center w-full h-40 border-2 border-dashed rounded-lg bg-muted/50">
              {preview ? (
                <Image src={preview} alt={`${title} preview`} fill className="object-contain rounded-lg p-2" />
              ) : (
                <div className="text-sm text-muted-foreground">No hay imagen.</div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`file-${assetKey}`}>Subir Nueva Imagen (PNG recomendado)</Label>
             <div className="relative flex justify-center items-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <Input
                    id={`file-${assetKey}`}
                    name="assetImage"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    required
                />
                <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <p className="text-sm">Arrastra o haz clic para subir</p>
                </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
