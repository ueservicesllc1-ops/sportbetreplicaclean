

'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ImageUp } from 'lucide-react';
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
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><ImageUp className="mr-2 h-4 w-4" /> Guardar Recurso</>}
    </Button>
  );
}

interface AssetUploadFormProps {
  assetKey: string;
  gameType: 'penalty_shootout' | 'mines';
  title: string;
  description: string;
  currentImageUrl: string | null;
}

export function AssetUploadForm({ assetKey, gameType, title, description, currentImageUrl: initialImageUrl }: AssetUploadFormProps) {
  const [state, formAction] = useActionState(updateGameAsset, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [imageUrl, setImageUrl] = useState(initialImageUrl || '');
  const { toast } = useToast();

  const isSoundAsset = assetKey.toLowerCase().includes('sound');

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
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <input type="hidden" name="assetKey" value={assetKey} />
        <input type="hidden" name="gameType" value={gameType} />
        <CardContent className="space-y-4">
          {!isSoundAsset && (
            <div className="space-y-2">
              <Label htmlFor={`image-${assetKey}`}>Vista Previa</Label>
              <div className="relative flex justify-center items-center w-full h-40 border-2 border-dashed rounded-lg bg-muted/50">
                {imageUrl ? (
                  <Image src={imageUrl} alt={`${title} preview`} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain rounded-lg p-2" />
                ) : (
                  <div className="text-sm text-muted-foreground">No hay imagen.</div>
                )}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={`url-${assetKey}`}>URL del Recurso</Label>
             <Input
                id={`url-${assetKey}`}
                name="assetImageUrl"
                type={isSoundAsset ? "text" : "url"}
                placeholder={isSoundAsset ? "https://example.com/sound.mp3" : "https://example.com/image.png"}
                defaultValue={initialImageUrl || ''}
                onChange={(e) => setImageUrl(e.target.value)}
                required
            />
            {isSoundAsset && imageUrl && (
              <div className='mt-2'>
                <audio controls src={imageUrl} className='w-full'>
                  Tu navegador no soporta el elemento de audio.
                </audio>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
