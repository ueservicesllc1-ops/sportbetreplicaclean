

'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import type { UserProfile, UserRole, VerificationStatus } from '@/contexts/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { updateUserRole } from '../actions';
import { useToast } from '@/hooks/use-toast';

function RoleBadge({ role }: { role: UserRole }) {
    const variant: "default" | "secondary" | "destructive" | "outline" =
        role === 'superadmin' ? 'default' :
        role === 'admin' ? 'secondary' :
        'outline';
    
    const text = 
        role === 'superadmin' ? 'Super Admin' :
        role === 'admin' ? 'Admin' :
        'Usuario';
    
    return (
        <Badge variant={variant} className={role === 'superadmin' ? 'bg-primary text-primary-foreground' : ''}>
            {text}
        </Badge>
    );
}

function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case 'verified':
      return <Badge className='bg-green-600 hover:bg-green-700'><ShieldCheck className="mr-1 h-3 w-3" /> Verificado</Badge>;
    case 'pending':
      return <Badge variant="secondary"><ShieldAlert className="mr-1 h-3 w-3" /> Pendiente</Badge>;
    case 'rejected':
        return <Badge variant="destructive"><ShieldX className="mr-1 h-3 w-3" /> Rechazado</Badge>;
    default:
      return <Badge variant="outline">No Verificado</Badge>;
  }
}

export function UsersTable({ initialUsers }: { initialUsers: UserProfile[]}) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [loading, setLoading] = useState(!initialUsers || initialUsers.length === 0);
  const { userProfile, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
     const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersData.push(doc.data() as UserProfile);
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
        await updateUserRole(userId, newRole);
        toast({ title: "Éxito", description: `El rol del usuario ha sido actualizado a ${newRole}.` });
    } catch (error) {
        console.error("Error updating user role:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        toast({ variant: 'destructive', title: "Error", description: errorMessage });
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Verificación</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                <TableRow key={user.uid}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                 <AvatarFallback>{user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className='grid gap-0.5'>
                                <p className="font-medium">{user.email}</p>
                                <Badge variant="outline" className='w-fit text-xs font-normal'>{user.uid}</Badge>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                        <VerificationStatusBadge status={user.verificationStatus} />
                    </TableCell>
                    <TableCell className="text-right font-mono">${(user.balance || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={!isSuperAdmin || user.uid === userProfile?.uid}>
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Cambiar Rol</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleRoleChange(user.uid, 'user')}>Usuario</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(user.uid, 'admin')}>Admin</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(user.uid, 'superadmin')}>Super Admin</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}
