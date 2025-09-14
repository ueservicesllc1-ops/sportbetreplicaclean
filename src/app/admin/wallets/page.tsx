

'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ShieldAlert, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addFundsToUser, searchUsers } from "./actions";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


interface UserSearchResult {
    uid: string;
    email: string;
    shortId: string;
    balance: number;
}

interface Transaction {
    id: string;
    userEmail: string;
    amount: number;
    adminEmail: string;
    createdAt: { seconds: number };
}

function TransactionsHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const transactionsRef = collection(db, 'wallet_transactions');
        const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(10));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs: Transaction[] = [];
            snapshot.forEach(doc => {
                txs.push({ id: doc.id, ...doc.data() } as Transaction);
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
                <CardDescription>Últimas 10 recargas de saldo realizadas por administradores.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                 <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && transactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No hay transacciones.
                                    </TableCell>
                                </TableRow>
                            )}
                            {transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium truncate max-w-[150px]">{tx.userEmail}</TableCell>
                                    <TableCell className="text-right text-green-500 font-bold">+${tx.amount.toFixed(2)}</TableCell>
                                    <TableCell className="truncate max-w-[150px]">{tx.adminEmail}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleString() : 'Justo ahora'}
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
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();
    const { userProfile, isSuperAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
        if (!authLoading && !isSuperAdmin) {
            router.replace('/admin');
        }
    }, [isSuperAdmin, authLoading, router]);

    const handleSearch = async () => {
        if (!searchTerm) return;
        setLoading(true);
        setSelectedUser(null);
        try {
            const results = await searchUsers(searchTerm);
            setSearchResults(results);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo realizar la búsqueda.' });
        } finally {
            setLoading(false);
        }
    };

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
            
            // Clear search and results
            setSearchTerm('');
            setSearchResults([]);
            setSelectedUser(null);
            setAmount('');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
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
                
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left Column: Search and List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Buscar Usuario</CardTitle>
                            <CardDescription>Busca por email o ID de usuario (ej. 1234A).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="email@ejemplo.com o 1234A"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                                <Button onClick={handleSearch} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                        <CardContent>
                            <h3 className="text-sm font-medium mb-2">Resultados:</h3>
                            <ScrollArea className="h-64">
                                <div className="space-y-2">
                                    {loading && <div className="text-sm text-muted-foreground p-4 text-center">Buscando...</div>}
                                    {!loading && searchResults.length === 0 && <div className="text-sm text-muted-foreground p-4 text-center">No se encontraron usuarios.</div>}
                                    {searchResults.map(user => (
                                        <div key={user.uid} className="flex justify-between items-center p-3 rounded-md border">
                                            <div>
                                                <p className="font-medium">{user.email}</p>
                                                <p className="text-sm text-muted-foreground">ID: {user.shortId} - Saldo: ${user.balance.toFixed(2)}</p>
                                            </div>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                                    <Coins className="mr-2 h-4 w-4" />
                                                    Añadir Fondos
                                                </Button>
                                            </DialogTrigger>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    
                    {/* Right Column: History */}
                    <TransactionsHistory />
                </div>

                {/* Dialog for Adding Funds */}
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Añadir Fondos</DialogTitle>
                        {selectedUser && (
                            <DialogDescription>
                                Estás añadiendo fondos a <span className="font-semibold text-foreground">{selectedUser.email}</span>.
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    {selectedUser && (
                        <div>
                            <div className="space-y-4 py-4">
                                 <div className="flex items-center justify-between rounded-lg border p-3">
                                    <p className="text-sm font-medium">Saldo Actual</p>
                                    <p className="font-bold text-lg text-primary">${selectedUser.balance.toFixed(2)}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Monto a Añadir</Label>
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
                                        Confirmar y Añadir Fondos
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

    
