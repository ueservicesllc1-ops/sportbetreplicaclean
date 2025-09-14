

'use client';

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addFundsToUser, searchUsers } from "./actions";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UserSearchResult {
    uid: string;
    email: string;
    shortId: string;
    balance: number;
}

export default function AdminWalletsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();
    const { isSuperAdmin, loading: authLoading } = useAuth();
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
        if (!selectedUser || !amount || parseFloat(amount) <= 0) {
             toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un usuario y un monto válido.' });
            return;
        }
        setSubmitting(true);
        try {
            const result = await addFundsToUser(selectedUser.uid, parseFloat(amount));
            toast({ title: 'Éxito', description: result.message });
            // Refresh user data
            setSelectedUser(prev => prev ? { ...prev, balance: prev.balance + parseFloat(amount) } : null);
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
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Billeteras</h1>
            
            <div className="grid md:grid-cols-2 gap-6">
                {/* Search Column */}
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
                        <div className="space-y-2">
                            {loading && <div className="text-sm text-muted-foreground">Buscando...</div>}
                            {!loading && searchResults.length === 0 && <div className="text-sm text-muted-foreground">No se encontraron usuarios.</div>}
                            {searchResults.map(user => (
                                <button key={user.uid} onClick={() => setSelectedUser(user)} className={`w-full text-left p-2 rounded-md border ${selectedUser?.uid === user.uid ? 'bg-secondary ring-2 ring-primary' : 'hover:bg-secondary/50'}`}>
                                    <p className="font-medium">{user.email}</p>
                                    <p className="text-sm text-muted-foreground">ID: {user.shortId} - Saldo: ${user.balance.toFixed(2)}</p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Add Funds Column */}
                 <Card>
                    <CardHeader>
                        <CardTitle>Añadir Fondos</CardTitle>
                        <CardDescription>Selecciona un usuario para añadirle fondos a su billetera.</CardDescription>
                    </CardHeader>
                    {selectedUser ? (
                        <>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="font-medium">{selectedUser.email}</p>
                                <div className="flex items-center gap-2">
                                     <Badge variant="outline">{selectedUser.shortId}</Badge>
                                     <span className="text-sm text-muted-foreground">Saldo actual: <span className="font-bold text-primary">${selectedUser.balance.toFixed(2)}</span></span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Input 
                                    type="number"
                                    placeholder="Monto a añadir"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleAddFunds} disabled={submitting || !amount || parseFloat(amount) <= 0}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Añadir Fondos
                            </Button>
                        </CardFooter>
                        </>
                    ): (
                        <CardContent>
                            <p className="text-sm text-center text-muted-foreground py-10">
                                Por favor, busca y selecciona un usuario.
                            </p>
                        </CardContent>
                    )}
                </Card>

            </div>
        </div>
    );
}
