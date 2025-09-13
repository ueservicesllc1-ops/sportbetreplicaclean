
'use server';

import admin from '@/lib/firebase-admin'; // Ensure admin is initialized
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

function getPublicUrl(bucketName: string, filePath: string) {
    return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

export async function addBanner(formData: FormData) {
    const title = formData.get('title') as string | null;
    const image = formData.get('image') as File | null;
    
    if (!title || title.trim().length < 3) {
        throw new Error('El título es requerido y debe tener al menos 3 caracteres.');
    }
    if (!image || image.size === 0) {
        throw new Error('La imagen es requerida.');
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
         throw new Error('La configuración del bucket de almacenamiento no está definida.');
    }
    
    try {
        const bucket = admin.storage().bucket();
        const filePath = `banners/${Date.now()}-${image.name}`;
        const file = bucket.file(filePath);
        const fileBuffer = Buffer.from(await image.arrayBuffer());

        await file.save(fileBuffer, {
            metadata: { contentType: image.type },
        });
        
        await file.makePublic();

        const imageUrl = getPublicUrl(bucketName, filePath);

        await addDoc(collection(db, 'banners'), {
            title: title,
            imageUrl: imageUrl,
            imagePath: filePath,
            createdAt: serverTimestamp(),
        });
        
        revalidatePath('/');
        revalidatePath('/admin/banners');
        
    } catch (error) {
        console.error('Error adding banner:', error);
        // En una app real, podrías devolver un estado de error más detallado.
        // Por ahora, lanzamos el error para que se pueda depurar en el servidor.
        throw new Error('No se pudo añadir el banner. Revisa la consola del servidor para más detalles.');
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
