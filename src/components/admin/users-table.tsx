
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, type Timestamp, query, orderBy } from 'firebase/firestore';
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
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

interface UserDoc {
  uid: string;
  email: string;
  balance: number;
  createdAt: Timestamp;
  shortId?: string;
}

export function UsersTable() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserDoc[] = [];
      snapshot.forEach((doc) => {
        usersData.push(doc.data() as UserDoc);
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
                <TableHead>ID Corto</TableHead>
                <TableHead>Fecha de Registro</TableHead>
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
                                 <AvatarFallback>{user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className='grid gap-0.5'>
                                <p className="font-medium">{user.email}</p>
                                <Badge variant="outline" className='w-fit text-xs'>{user.uid}</Badge>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge>{user.shortId || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                        {new Date(user.createdAt.seconds * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">${user.balance.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                        <Button variant="outline" size="sm" disabled>
                           Gestionar
                        </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}
