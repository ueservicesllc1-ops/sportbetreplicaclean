
'use client';

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ShieldAlert, Coins, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addFundsToUser, searchUsers } from "./actions";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { collection, onSnapshot, orderBy, query, limit, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


interface UserSearchResult {
    uid: string;
    email: string;
    shortId: string;
    balance: number;
}

interface WalletTransaction {
    id: string;
    userEmail: string;
    amount: number;
    adminEmail?: string;
    country?: string;
    createdAt: Timestamp;
}

function TransactionsHistory() {
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const transactionsRef = collection(db, 'wallet_transactions');
        const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(15));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs: WalletTransaction[] = [];
            snapshot.forEach(doc => {
                txs.push({ id: doc.id, ...doc.data() } as WalletTransaction);
            });
            setTransactions(txs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Historial de Recargas</CardTitle>
                <CardDescription>Últimas 15 recargas de saldo realizadas por administradores.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>ID Transacción</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Hora</TableHead>
                                <TableHead>Ubicación (País)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                 <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && transactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No hay transacciones.
                                    </TableCell>
                                </TableRow>
                            )}
                            {transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium truncate max-w-[150px]">{tx.userEmail}</TableCell>
                                    <TableCell className="text-right text-green-500 font-bold">+${tx.amount.toFixed(2)}</TableCell>
                                    <TableCell className="truncate max-w-[150px]">{tx.adminEmail || 'N/A'}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-mono">{tx.id}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                                    </TableCell>
                                     <TableCell className="text-xs text-muted-foreground">
                                        {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleTimeString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                        <div className="flex items-center gap-2">
                                            <Fingerprint className="h-4 w-4" />
                                            <span>{tx.country || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

export default function AdminWalletsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();
    const { userProfile, isSuperAdmin, loading: authLoading } = useAuth();
    
    useEffect(() => {
        if (!authLoading && !isSuperAdmin) {
            router.replace('/admin');
        }
    }, [isSuperAdmin, authLoading, router]);

    const handleSearch = useCallback(async (term: string) => {
        if (!term) return;

        setLoading(true);
        setSelectedUser(null);
        try {
            const results = await searchUsers(term);
            setSearchResults(results);
            if (results.length === 0) {
                 toast({ variant: 'default', title: 'Sin Resultados', description: 'No se encontraron usuarios con ese criterio de búsqueda.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo realizar la búsqueda.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

     useEffect(() => {
        const initialSearch = searchParams.get('search');
        if (initialSearch) {
            setSearchTerm(initialSearch);
            handleSearch(initialSearch);
        }
    }, [searchParams, handleSearch]);

    const handleAddFunds = async () => {
        if (!selectedUser || !amount || parseFloat(amount) <= 0 || !userProfile) {
             toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un usuario y un monto válido.' });
            return;
        }
        setSubmitting(true);
        try {
            const result = await addFundsToUser({
                userId: selectedUser.uid,
                userEmail: selectedUser.email,
                amount: parseFloat(amount),
                adminId: userProfile.uid,
                adminEmail: userProfile.email || 'N/A'
            });
            toast({ title: 'Éxito', description: result.message });
            
            setSearchTerm('');
            setSearchResults([]);
            setSelectedUser(null);
            setAmount('');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setSubmitting(false);
        }
    }
    
    if (authLoading) {
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

    return (
        <Dialog onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Billeteras</h1>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Recarga Manual de Saldo</CardTitle>
                        <CardDescription>Busca un usuario por su email o ID para añadirle fondos manualmente tras verificar una notificación de depósito.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="email@ejemplo.com o 1234A"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch(searchTerm)}
                            />
                            <Button onClick={() => handleSearch(searchTerm)} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardContent>
                    {searchResults.length > 0 && (
                        <CardContent>
                            <h3 className="text-sm font-medium mb-2">Resultados:</h3>
                            <ScrollArea className="h-40">
                                <div className="space-y-2">
                                    {loading && <div className="text-sm text-muted-foreground p-4 text-center">Buscando...</div>}
                                    {searchResults.map(user => (
                                        <div key={user.uid} className="flex justify-between items-center p-3 rounded-md border">
                                            <div>
                                                <p className="font-medium">{user.email}</p>
                                                <p className="text-sm text-muted-foreground">ID: {user.shortId} - Saldo: ${user.balance.toFixed(2)}</p>
                                            </div>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                                    <Coins className="mr-2 h-4 w-4" />
                                                    Recargar Saldo
                                                </Button>
                                            </DialogTrigger>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    )}
                     {!loading && searchTerm && searchResults.length === 0 && (
                        <CardContent>
                            <div className="text-sm text-muted-foreground p-4 text-center border-dashed border-2 rounded-md">No se encontraron usuarios.</div>
                        </CardContent>
                    )}
                </Card>

                <TransactionsHistory />

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Recargar Saldo Manualmente</DialogTitle>
                        <DialogDescription>
                            {selectedUser ? 
                                `Estás a punto de recargar el saldo de ${selectedUser.email}.` :
                                "Selecciona un usuario para añadirle fondos."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div>
                            <div className="space-y-4 py-4">
                                 <div className="flex items-center justify-between rounded-lg border p-3">
                                    <p className="text-sm font-medium">Saldo Actual</p>
                                    <p className="font-bold text-lg text-primary">${selectedUser.balance.toFixed(2)}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Monto a Acreditar</Label>
                                    <Input 
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        disabled={submitting}
                                        className="text-lg h-11"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" disabled={submitting}>Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                     <Button onClick={handleAddFunds} disabled={submitting || !amount || parseFloat(amount) <= 0}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirmar Recarga
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </div>
        </Dialog>
    );
}
