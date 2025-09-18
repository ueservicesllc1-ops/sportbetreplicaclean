

'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, type Timestamp } from 'firebase/firestore';
import { Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { deleteBanner } from '../actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface BannerDoc {
  id: string;
  title?: string;
  imageUrl: string;
  createdAt: Timestamp;
}

export function BannersList() {
  const [banners, setBanners] = useState<BannerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bannersData: BannerDoc[] = [];
      snapshot.forEach((doc) => {
        bannersData.push({ id: doc.id, ...doc.data() } as BannerDoc);
      });
      setBanners(bannersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (bannerId: string) => {
    setDeletingId(bannerId);
    try {
      await deleteBanner(bannerId);
      toast({
        title: 'Banner eliminado',
        description: 'El banner ha sido eliminado correctamente.',
      });
    } catch (error) {
        console.error("Error deleting banner:", error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        toast({
            variant: 'destructive',
            title: 'Error al eliminar',
            description: `No se pudo eliminar el banner: ${errorMessage}`,
        });
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if(banners.length === 0) {
    return <p className='text-sm text-muted-foreground text-center py-8'>No hay banners para mostrar.</p>
  }

  return (
    <div className="space-y-4">
      {banners.map((banner) => (
        <div key={banner.id} className="flex items-center gap-4 rounded-lg border p-3">
          <div className="relative h-16 w-28 flex-shrink-0">
             <Image
                src={banner.imageUrl}
                alt={banner.title || 'Banner Image'}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover rounded-md"
              />
          </div>
          <div className='flex-grow min-w-0'>
            <p className="font-semibold truncate text-sm">{banner.imageUrl}</p>
            <p className="text-xs text-muted-foreground">
                Creado: {new Date(banner.createdAt.seconds * 1000).toLocaleDateString()}
            </p>
          </div>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" disabled={deletingId === banner.id}>
                        {deletingId === banner.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el banner.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(banner.id)}>
                        Eliminar
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      ))}
    </div>
  );
}
