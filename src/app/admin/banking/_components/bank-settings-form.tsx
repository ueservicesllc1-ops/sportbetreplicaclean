
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Banknote, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BankingInfo } from '../actions';
import { updateBankingSettings } from '../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const initialState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
      Guardar Configuración
    </Button>
  );
}


export function BankSettingsForm({ initialData }: { initialData: BankingInfo }) {
  const [state, formAction] = useActionState(updateBankingSettings, initialState);
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
    <form action={formAction} className="space-y-8">
        
        <div className="grid md:grid-cols-2 gap-8">
            {/* Bank Account Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Banknote className="h-5 w-5" />
                        <span>Cuenta de Destino</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="bankName">Banco</Label>
                            <Input id="bankName" name="bankName" defaultValue={initialData.bankName} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accountType">Tipo de Cuenta</Label>
                            <Input id="accountType" name="accountType" defaultValue={initialData.accountType} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="accountHolder">Titular de la Cuenta</Label>
                        <Input id="accountHolder" name="accountHolder" defaultValue={initialData.accountHolder} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ruc">RUC / C.I.</Label>
                            <Input id="ruc" name="ruc" defaultValue={initialData.ruc} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accountNumber">Nº de Cuenta</Label>
                            <Input id="accountNumber" name="accountNumber" defaultValue={initialData.accountNumber} />
                        </div>
                    </div>
                    <Separator />
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email para Comprobantes</Label>
                            <Input id="email" name="email" type="email" defaultValue={initialData.email} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp para Comprobantes</Label>
                            <Input id="whatsapp" name="whatsapp" defaultValue={initialData.whatsapp} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bank Logos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ImageIcon className="h-5 w-5" />
                        <span>Logos de Bancos</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="logoPichincha">URL Logo Pichincha</Label>
                        <Input id="logoPichincha" name="logoPichincha" type="url" defaultValue={initialData.logoPichincha} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="logoGuayaquil">URL Logo Guayaquil</Label>
                        <Input id="logoGuayaquil" name="logoGuayaquil" type="url" defaultValue={initialData.logoGuayaquil} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="logoInternacional">URL Logo Internacional</Label>
                        <Input id="logoInternacional" name="logoInternacional" type="url" defaultValue={initialData.logoInternacional} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="logoPacifico">URL Logo Pacífico</Label>
                        <Input id="logoPacifico" name="logoPacifico" type="url" defaultValue={initialData.logoPacifico} />
                    </div>
                </CardContent>
            </Card>
        </div>
      
      <SubmitButton />
    </form>
  );
}
