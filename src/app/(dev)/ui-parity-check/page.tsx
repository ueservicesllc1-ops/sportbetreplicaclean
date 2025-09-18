'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { performUiCheck } from './actions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UiParityCheckPage() {
  const [originalScreenshot, setOriginalScreenshot] = useState<string | null>(null);
  const [replicaScreenshot, setReplicaScreenshot] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!originalScreenshot || !replicaScreenshot) {
      setError('Por favor, sube ambas capturas de pantalla.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await performUiCheck(originalScreenshot, replicaScreenshot);
      setSuggestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>UI Parity Check</CardTitle>
        <CardDescription>
          Sube una captura de pantalla del sitio original y una de la réplica para obtener sugerencias de mejora de la IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="original-screenshot">Original Screenshot</Label>
            <Input id="original-screenshot" type="file" accept="image/*" onChange={(e) => handleFileChange(e, setOriginalScreenshot)} />
            {originalScreenshot && <img src={originalScreenshot} alt="Original Screenshot Preview" className="mt-2 rounded-lg" />}
          </div>
          <div className="space-y-2">
            <Label htmlFor="replica-screenshot">Replica Screenshot</Label>
            <Input id="replica-screenshot" type="file" accept="image/*" onChange={(e) => handleFileChange(e, setReplicaScreenshot)} />
            {replicaScreenshot && <img src={replicaScreenshot} alt="Replica Screenshot Preview" className="mt-2 rounded-lg" />}
          </div>
        </div>

        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {loading && (
            <div className='flex items-center justify-center gap-2 text-muted-foreground'>
                <Loader2 className='h-5 w-5 animate-spin' />
                <span>Analizando...</span>
            </div>
        )}

        {suggestions && (
            <Card className='bg-secondary'>
                <CardHeader>
                    <CardTitle className='text-lg'>Sugerencias de la IA</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="whitespace-pre-wrap font-body text-sm">{suggestions}</pre>
                </CardContent>
            </Card>
        )}

      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={loading || !originalScreenshot || !replicaScreenshot}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Analizar UI
        </Button>
      </CardFooter>
    </Card>
  );
}
