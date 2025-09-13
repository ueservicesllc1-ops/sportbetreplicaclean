
'use server';

import admin from '@/lib/firebase-admin'; // Ensure admin is initialized
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function addBanner(formData: FormData) {
    const title = formData.get('title') as string;
    const imageFile = formData.get('image') as File;

    if (!title || title.trim().length === 0) {
        return { success: false, message: 'El título es requerido.' };
    }
    if (!imageFile || imageFile.size === 0) {
        return { success: false, message: 'La imagen es requerida.' };
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        return { success: false, message: 'El bucket de almacenamiento no está configurado.' };
    }

    try {
        const bucket = admin.storage().bucket(bucketName);
        const imagePath = `banners/${Date.now()}-${imageFile.name}`;
        const file = bucket.file(imagePath);

        const fileBuffer = Buffer.from(await imageFile.arrayBuffer());

        await file.save(fileBuffer, {
            metadata: { contentType: imageFile.type },
        });

        await file.makePublic();

        const imageUrl = file.publicUrl();

        await addDoc(collection(db, 'banners'), {
            title,
            imageUrl,
            imagePath, // Guardamos la ruta para poder borrarla después
            createdAt: serverTimestamp(),
        });
        
        revalidatePath('/admin/banners');
        revalidatePath('/'); // Revalida la página de inicio para que se vea el nuevo banner
        
        return { success: true, message: 'El banner ha sido añadido correctamente.' };

    } catch(error) {
        console.error('Error adding banner: ', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        return { success: false, message: `No se pudo añadir el banner: ${errorMessage}` };
    }
}


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
            const bucket = admin.storage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
            const file = bucket.file(imagePath);
            await file.delete();
        }
        
        revalidatePath('/');
        revalidatePath('/admin/banners');
        
        return { success: true, message: 'Banner eliminado correctamente.' };

    } catch (error) {
        console.error('Error deleting banner:', error);
        throw new Error('No se pudo eliminar el banner.');
    }
}
