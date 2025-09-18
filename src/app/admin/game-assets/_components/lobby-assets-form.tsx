
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ImageUp } from 'lucide-react';
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
    { key: 'mines', title: 'Campo Minado' },
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
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

    return (
         <div className="space-y-2">
            <Label htmlFor={`url-${assetKey}`} className='font-semibold'>{title}</Label>
            <div className="relative flex justify-center items-center w-full aspect-[4/3] border-2 border-dashed rounded-lg bg-muted/50">
              {preview ? (
                <Image src={preview} alt={`${title} preview`} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover rounded-lg" />
              ) : (
                <div className="text-sm text-muted-foreground p-2 text-center">No hay imagen de portada.</div>
              )}
            </div>
             <div className="relative">
                <Input
                    id={`url-${assetKey}`}
                    name={assetKey}
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    defaultValue={currentImageUrl || ''}
                    onChange={(e) => setPreview(e.target.value)}
                />
            </div>
          </div>
    )
}
