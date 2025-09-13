

'use server';

import { db } from '@/lib/firebase';
import admin from '@/lib/firebase-admin';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

interface BannerData {
    title: string;
    imagePath: string;
}

function getPublicUrl(bucketName: string, filePath: string) {
    return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

export async function addBanner(data: BannerData) {
    if (!data.title || !data.imagePath) {
        throw new Error('Título e imagen son requeridos.');
    }

    try {
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            throw new Error('La configuración del bucket de almacenamiento no está definida.');
        }

        const imageUrl = getPublicUrl(bucketName, data.imagePath);

        await addDoc(collection(db, 'banners'), {
            title: data.title,
            imageUrl: imageUrl,
            createdAt: serverTimestamp(),
        });
        
        revalidatePath('/'); // Revalidate the homepage to show the new banner
        revalidatePath('/admin/banners');
        
        return { success: true, message: 'Banner añadido correctamente.' };

    } catch (error) {
        console.error('Error adding banner:', error);
        throw new Error('No se pudo añadir el banner.');
    }
}

export async function deleteBanner(bannerId: string) {
    if (!bannerId) {
        throw new Error('ID del banner no proporcionado.');
    }

    const bannerDocRef = doc(db, 'banners', bannerId);

    try {
        await deleteDoc(bannerDocRef);
        
        revalidatePath('/');
        revalidatePath('/admin/banners');
        
        return { success: true, message: 'Banner eliminado correctamente.' };

    } catch (error) {
        console.error('Error deleting banner:', error);
        throw new Error('No se pudo eliminar el banner.');
    }
}
