
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const ASSET_COLLECTION = 'game_assets';
const PENALTY_SHOOTOUT_DOC = 'penalty_shootout';

export async function getPenaltyGameAssets(): Promise<Record<string, string | number>> {
    try {
        const docRef = doc(db, ASSET_COLLECTION, PENALTY_SHOOTOUT_DOC);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // We need to remove it before passing the object to a Client Component.
            const { lastUpdated, ...assets } = data;
            return assets;
        }
        return {};
    } catch (error) {
        console.error("Error getting game assets:", error);
        return {};
    }
}


export async function updateGameAsset(prevState: any, formData: FormData): Promise<{ success: boolean; message: string; }> {
  const assetKey = formData.get('assetKey') as string | null;
  const assetImage = formData.get('assetImage') as File | null;
  
  if (!assetKey) {
    return { success: false, message: 'Falta la clave del recurso (assetKey).' };
  }
  if (!assetImage || assetImage.size === 0) {
    return { success: false, message: 'No se ha seleccionado ningún archivo de imagen.' };
  }

  try {
    const admin = await getFirebaseAdmin();
    const bucket = admin.storage().bucket();
    const filePath = `game-assets/penalty-shootout/${assetKey}-${Date.now()}.${assetImage.name.split('.').pop()}`;
    const file = bucket.file(filePath);
    const fileBuffer = Buffer.from(await assetImage.arrayBuffer());

    // Upload the file and make it public
    await file.save(fileBuffer, {
      metadata: { 
        contentType: assetImage.type,
      },
      public: true,
    });
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    const docRef = doc(db, ASSET_COLLECTION, PENALTY_SHOOTOUT_DOC);

    await setDoc(docRef, {
        [assetKey]: publicUrl,
        lastUpdated: serverTimestamp()
    }, { merge: true });

    revalidatePath('/admin/game-assets');
    revalidatePath('/casino/penalty-shootout');
    
    return { success: true, message: 'La imagen del recurso se ha actualizado correctamente.' };

  } catch (error) {
    console.error('Error updating game asset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return { success: false, message: `No se pudo actualizar la imagen: ${errorMessage}` };
  }
}

    