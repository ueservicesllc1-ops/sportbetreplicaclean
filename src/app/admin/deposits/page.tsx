
'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, ShieldAlert, Check, X, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collection, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { processDepositNotification } from "./actions";
import Link from "next/link";


interface DepositNotification {
    id: string;
    userId: string;
    userEmail: string;
    amount: number;
    reference: string;
    notes?: string;
    status: 'pending' | 'completed' | 'rejected';
    createdAt: Timestamp;
    processedAt?: Timestamp;
}

function StatusBadge({ status }: { status: DepositNotification['status'] }) {
    const variant = status === 'pending' ? 'secondary' : status === 'completed' ? 'default' : 'destructive';
    const text = status === 'pending' ? 'Pendiente' : status === 'completed' ? 'Completado' : 'Rechazado';
    const className = status === 'completed' ? 'bg-green-600 text-white' : '';
    return <Badge variant={variant} className={className}>{text}</Badge>
}

export default function AdminDepositsPage() {
    const [requests, setRequests] = useState<DepositNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { toast } = useToast();
    const { isSuperAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

     useEffect(() => {
        if (!authLoading && !isSuperAdmin) {
            router.replace('/admin');
        }
    }, [isSuperAdmin, authLoading, router]);

    useEffect(() => {
        if (!isSuperAdmin) return;
        const q = query(collection(db, 'deposit_notifications'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs: DepositNotification[] = [];
            snapshot.forEach(doc => {
                reqs.push({ id: doc.id, ...doc.data() } as DepositNotification);
            });
            setRequests(reqs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isSuperAdmin]);
    
    const handleProcess = async (id: string, action: 'approve' | 'reject') => {
        setProcessingId(id);
        try {
            await processDepositNotification(id, action);
            toast({
                title: 'Notificación Procesada',
                description: `La notificación de depósito ha sido ${action === 'approve' ? 'marcada como completada' : 'rechazada'}.`
            });
        } catch (error) {
            console.error("Error processing deposit notification:", error);
            const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setProcessingId(null);
        }
    }


    if (authLoading || loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (!isSuperAdmin) {
        return (
             <Card className="text-center">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2">
                        <ShieldAlert className="h-6 w-6" />
                        Acceso Denegado
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
                </CardContent>
            </Card>
        )
    }

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Notificaciones de Depósito</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Notificaciones Pendientes</CardTitle>
                    <CardDescription>
                        Los usuarios han enviado estas notificaciones de depósito. Verifica la transacción y luego acredítales el saldo en la sección de <Link href="/admin/wallets" className="text-primary underline">Billeteras</Link>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead>Referencia</TableHead>
                                <TableHead>Notas</TableHead>
                                <TableHead className="text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">No hay notificaciones pendientes.</TableCell>
                                </TableRow>
                            )}
                            {pendingRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="text-sm">{new Date(req.createdAt.seconds * 1000).toLocaleString()}</TableCell>
                                    <TableCell className="font-medium">{req.userEmail}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-green-500">${req.amount.toFixed(2)}</TableCell>
                                    <TableCell className="font-mono text-xs">{req.reference}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{req.notes}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex gap-2 justify-center">
                                             <Button asChild size="sm" variant="outline">
                                                <Link href={`/admin/wallets?search=${req.userEmail}`}>
                                                    <Wallet className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="bg-green-500 hover:bg-green-600 text-white"
                                                onClick={() => handleProcess(req.id, 'approve')}
                                                disabled={processingId === req.id}
                                            >
                                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="destructive"
                                                onClick={() => handleProcess(req.id, 'reject')}
                                                disabled={processingId === req.id}
                                            >
                                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Historial de Notificaciones</CardTitle>
                    <CardDescription>Lista de todas las notificaciones que han sido procesadas.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha Notificación</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead>Referencia</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha de Proceso</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">No hay notificaciones procesadas.</TableCell>
                                </TableRow>
                            )}
                            {processedRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="text-sm">{new Date(req.createdAt.seconds * 1000).toLocaleString()}</TableCell>
                                    <TableCell className="font-medium">{req.userEmail}</TableCell>
                                    <TableCell className="text-right font-mono font-bold">${req.amount.toFixed(2)}</TableCell>
                                    <TableCell className="font-mono text-xs">{req.reference}</TableCell>
                                    <TableCell><StatusBadge status={req.status} /></TableCell>
                                    <TableCell className="text-sm">
                                        {req.processedAt ? new Date(req.processedAt.seconds * 1000).toLocaleString() : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
