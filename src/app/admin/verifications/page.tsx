
'use client';

import { useState, useEffect } from "react";
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, ShieldAlert, Check, X, User, Hash, FileImage } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collection, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, VerificationStatus } from "@/contexts/auth-context";
import { processVerification } from "./actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription as AlertDescriptionComponent } from "@/components/ui/alert";


interface VerificationRequest extends UserProfile {
    requestedAt?: Timestamp; // Assuming we might add this field later
}

function StatusBadge({ status }: { status: VerificationStatus }) {
    const variant = status === 'pending' ? 'secondary' : status === 'verified' ? 'default' : 'destructive';
    const text = status === 'pending' ? 'Pendiente' : status === 'verified' ? 'Aprobado' : 'Rechazado';
    const className = status === 'verified' ? 'bg-green-600 text-white' : '';
    return <Badge variant={variant} className={className}>{text}</Badge>
}

export default function AdminVerificationsPage() {
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const { toast } = useToast();
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

     useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.replace('/admin');
        }
    }, [isAdmin, authLoading, router]);

    useEffect(() => {
        if (!isAdmin) return;
        const q = query(collection(db, 'users'), orderBy('verificationStatus', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs: VerificationRequest[] = [];
            snapshot.forEach(doc => {
                const data = doc.data() as UserProfile;
                 // Only show users who have submitted something
                if(data.verificationStatus !== 'unverified' && data.realName) {
                    reqs.push(data as VerificationRequest);
                }
            });
            setRequests(reqs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAdmin]);
    
    const handleProcess = async (id: string, action: 'approve' | 'reject') => {
        setProcessingId(id);
        try {
            await processVerification(id, action);
            toast({
                title: 'Solicitud Procesada',
                description: `La verificación ha sido ${action === 'approve' ? 'aprobada' : 'rechazada'}.`
            });
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setProcessingId(null);
        }
    }


    if (authLoading || loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (!isAdmin) {
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

    const pendingRequests = requests.filter(r => r.verificationStatus === 'pending');
    const processedRequests = requests.filter(r => r.verificationStatus !== 'pending');

    return (
        <Dialog onOpenChange={() => setImageError(false)}>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Verificaciones de Identidad (KYC)</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Solicitudes Pendientes</CardTitle>
                        <CardDescription>Estas solicitudes de verificación de identidad requieren tu atención.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Nombre Real</TableHead>
                                    <TableHead>Cédula</TableHead>
                                    <TableHead className="text-center">Documento</TableHead>
                                    <TableHead className="text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No hay solicitudes pendientes.</TableCell>
                                    </TableRow>
                                )}
                                {pendingRequests.map(req => (
                                    <TableRow key={req.uid}>
                                        <TableCell className="font-medium">{req.email}</TableCell>
                                        <TableCell>{req.realName}</TableCell>
                                        <TableCell className="font-mono">{req.idNumber}</TableCell>
                                        <TableCell className="text-center">
                                            {req.idPhotoUrl && (
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <FileImage className="mr-2 h-4 w-4" />
                                                        Ver Foto
                                                    </Button>
                                                </DialogTrigger>
                                            )}
                                            
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="bg-green-500 hover:bg-green-600 text-white"
                                                    onClick={() => handleProcess(req.uid, 'approve')}
                                                    disabled={processingId === req.uid}
                                                >
                                                    {processingId === req.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="destructive"
                                                    onClick={() => handleProcess(req.uid, 'reject')}
                                                    disabled={processingId === req.uid}
                                                >
                                                    {processingId === req.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <DialogContent className="max-w-xl">
                                             <DialogHeader>
                                                <DialogTitle>Documento de {req.realName}</DialogTitle>
                                                <DialogDescription>
                                                    Documento de identidad subido por el usuario.
                                                </DialogDescription>
                                             </DialogHeader>
                                            
                                             {req.idPhotoUrl && (
                                                <div className="mt-4 rounded-md bg-secondary p-4 relative aspect-video">
                                                  <Image src={req.idPhotoUrl} alt={`Documento de ${req.realName}`} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain rounded-md" />
                                                </div>
                                             )}
                                        </DialogContent>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Verificaciones</CardTitle>
                        <CardDescription>Lista de todas las solicitudes que han sido procesadas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Nombre Real</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processedRequests.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No hay solicitudes procesadas.</TableCell>
                                    </TableRow>
                                )}
                                {processedRequests.map(req => (
                                    <TableRow key={req.uid}>
                                        <TableCell className="font-medium">{req.email}</TableCell>
                                        <TableCell>{req.realName}</TableCell>
                                        <TableCell><StatusBadge status={req.verificationStatus} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </Dialog>
    )
}
