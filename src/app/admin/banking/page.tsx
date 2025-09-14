
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BankSettingsForm } from "./_components/bank-settings-form";
import { getBankingSettings } from "./actions";


export default async function AdminBankingPage() {
    const bankingSettings = await getBankingSettings();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Configuración Bancaria</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Datos para Transferencias</CardTitle>
                    <CardDescription>
                       Gestiona la información de la cuenta bancaria que los usuarios verán para realizar depósitos por transferencia.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BankSettingsForm initialData={bankingSettings} />
                </CardContent>
            </Card>
        </div>
    )
}
