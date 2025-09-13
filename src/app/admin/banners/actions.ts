
'use server';

import admin from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';


export async function deleteBanner(bannerId: string) {
    if (!bannerId) {
        throw new Error('ID del banner no proporcionado.');
    }

    const bannerDocRef = doc(db, 'banners', bannerId);

    try {
        const bannerDoc = await getDoc(bannerDocRef);
        if(!bannerDoc.exists()){
            throw new Error('El banner no existe.');
        }
        const { imagePath } = bannerDoc.data();

        // Delete from firestore
        await deleteDoc(bannerDocRef);

        // Delete from storage
        if(imagePath){
             const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
            if (bucketName) {
                const bucket = admin.storage().bucket(bucketName);
                const file = bucket.file(imagePath);
                await file.delete();
            }
        }
        
        revalidatePath('/');
        revalidatePath('/admin/banners');
        
        return { success: true, message: 'Banner eliminado correctamente.' };

    } catch (error) {
        console.error('Error deleting banner:', error);
        throw new Error('No se pudo eliminar el banner.');
    }
}
