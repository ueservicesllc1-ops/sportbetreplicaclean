
'use server';

import admin from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

interface FormState {
  success: boolean;
  message: string;
}

export async function addBanner(prevState: FormState, formData: FormData): Promise<FormState> {
  const imageUrl = formData.get('imageUrl') as string | null;

  if (!imageUrl || !imageUrl.trim().startsWith('http')) {
    return { success: false, message: 'La URL de la imagen es requerida y debe ser un enlace válido.' };
  }

  try {
    await addDoc(collection(db, 'banners'), {
      imageUrl: imageUrl,
      imagePath: '', // This field can be used in the future if we switch to direct uploads
      createdAt: serverTimestamp(),
    });
    
    revalidatePath('/');
    revalidatePath('/admin/banners');
    
    return { success: true, message: '¡Banner añadido con éxito!' };

  } catch (error) {
    console.error('Error adding banner:', error);
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

        // Delete from storage if imagePath exists (for manually uploaded images in the future)
        if(imagePath){
             const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
            if (bucketName) {
                try {
                    const bucket = admin.storage().bucket(bucketName);
                    const file = bucket.file(imagePath);
                    await file.delete();
                } catch (storageError) {
                    console.warn(`Could not delete file ${imagePath} from storage. It might not exist if created via URL.`);
                }
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
