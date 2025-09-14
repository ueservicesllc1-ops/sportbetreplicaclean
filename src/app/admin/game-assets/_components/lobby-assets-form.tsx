
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
import { updateLobbyAssets } from '../actions';

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
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><ImageUp className="mr-2 h-4 w-4" /> Guardar Imágenes del Lobby</>}
    </Button>
  );
}

const games = [
    { key: 'penalty_shootout', title: 'Tanda de Penales' },
    { key: 'ruleta', title: 'Ruleta de la Suerte' },
    { key: 'speedrun', title: 'Speedrun' },
]

interface LobbyAssetsFormProps {
    currentImages: Record<string, string>;
}

export function LobbyAssetsForm({ currentImages }: LobbyAssetsFormProps) {
  const [state, formAction] = useActionState(updateLobbyAssets, initialState);
  const { toast } = useToast();

   useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: '¡Éxito!', description: state.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: state.message });
      }
    }
  }, [state, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imágenes del Lobby de Casino</CardTitle>
        <CardDescription>Gestiona las imágenes de portada para los juegos que se muestran en la página del casino.</CardDescription>
      </CardHeader>
       <form action={formAction}>
        <CardContent className="grid gap-6 md:grid-cols-3">
            {games.map(game => (
                <LobbyAssetInput 
                    key={game.key}
                    assetKey={game.key}
                    title={game.title}
                    currentImageUrl={currentImages[game.key] || null}
                />
            ))}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}


interface LobbyAssetInputProps {
    assetKey: string;
    title: string;
    currentImageUrl: string | null;
}

function LobbyAssetInput({ assetKey, title, currentImageUrl }: LobbyAssetInputProps) {
    const [preview, setPreview] = useState<string | null>(currentImageUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
         <div className="space-y-2">
            <Label htmlFor={`file-${assetKey}`} className='font-semibold'>{title}</Label>
            <div className="relative flex justify-center items-center w-full aspect-[4/3] border-2 border-dashed rounded-lg bg-muted/50">
              {preview ? (
                <Image src={preview} alt={`${title} preview`} fill className="object-cover rounded-lg" />
              ) : (
                <div className="text-sm text-muted-foreground p-2 text-center">No hay imagen de portada.</div>
              )}
            </div>
             <div className="relative">
                <Input
                    id={`file-${assetKey}`}
                    name={assetKey}
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                />
                <Button asChild variant="outline" className='w-full pointer-events-none'>
                    <div className="flex items-center gap-1 text-center text-muted-foreground">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Cambiar Imagen</span>
                    </div>
                </Button>
            </div>
          </div>
    )
}
