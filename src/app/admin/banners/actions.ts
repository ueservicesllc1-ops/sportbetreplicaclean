

'use server';

import admin from '@/lib/firebase-admin'; // Ensure admin is initialized
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

interface BannerData {
    title: string;
    imagePath: string;
}

function getPublicUrl(bucketName: string, filePath: string) {
    return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

export async function uploadFileToStorage(formData: FormData) {
  const image = formData.get('image') as File | null;
  if (!image) {
    throw new Error('No se encontró ninguna imagen en la solicitud.');
  }

  const bucket = admin.storage().bucket();
  const filePath = `user-documents/banners/${Date.now()}-${image.name}`;
  const file = bucket.file(filePath);

  const fileBuffer = Buffer.from(await image.arrayBuffer());

  try {
    await file.save(fileBuffer, {
      metadata: { contentType: image.type },
      public: true, // Make file public
    });
     return { filePath };
  } catch (error) {
    console.error('Error al subir el archivo a GCS:', error);
    throw new Error('No se pudo subir el archivo a Storage.');
  }
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
            imagePath: data.imagePath, // Keep track of the path for deletion
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
        const bannerDoc = await getDoc(bannerDocRef);
        if(!bannerDoc.exists()){
            throw new Error('El banner no existe.');
        }
        const { imagePath } = bannerDoc.data();

        // Delete from firestore
        await deleteDoc(bannerDocRef);

        // Delete from storage
        if(imagePath){
            const bucket = admin.storage().bucket();
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
