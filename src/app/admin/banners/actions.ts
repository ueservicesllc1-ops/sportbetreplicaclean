

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
    
    if (!title || !image) {
        return { success: false, message: 'Título e imagen son requeridos.' };
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
         return { success: false, message: 'La configuración del bucket de almacenamiento no está definida.' };
    }
    
    const bucket = admin.storage().bucket();
    const filePath = `user-documents/banners/${Date.now()}-${image.name}`;
    const file = bucket.file(filePath);
    const fileBuffer = Buffer.from(await image.arrayBuffer());

    try {
        // Upload image to GCS
        await file.save(fileBuffer, {
            metadata: { contentType: image.type },
        });
        
        // Make file public to get public URL
        await file.makePublic();

        const imageUrl = getPublicUrl(bucketName, filePath);

        // Save banner metadata to Firestore
        await addDoc(collection(db, 'banners'), {
            title: title,
            imageUrl: imageUrl,
            imagePath: filePath, // Keep track of the path for deletion
            createdAt: serverTimestamp(),
        });
        
        revalidatePath('/'); // Revalidate the homepage to show the new banner
        revalidatePath('/admin/banners');
        
        return { success: true, message: 'Banner añadido correctamente.' };

    } catch (error) {
        console.error('Error adding banner:', error);
        return { success: false, message: 'No se pudo añadir el banner.' };
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
