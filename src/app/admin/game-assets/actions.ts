
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const ASSET_COLLECTION = 'game_assets';
const PENALTY_SHOOTOUT_DOC = 'penalty_shootout';
const CASINO_LOBBY_DOC = 'casino_lobby';


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

export async function getLobbyAssets(): Promise<Record<string, string>> {
    try {
        const docRef = doc(db, ASSET_COLLECTION, CASINO_LOBBY_DOC);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const { lastUpdated, ...assets } = data;
            return assets as Record<string, string>;
        }
        return {};
    } catch (error) {
        console.error("Error getting lobby assets:", error);
        return {};
    }
}


export async function updateLobbyAssets(prevState: any, formData: FormData): Promise<{ success: boolean; message: string; }> {
    const assetsToUpdate = [
        { key: 'penalty_shootout', file: formData.get('penalty_shootout') as File | null },
        { key: 'ruleta', file: formData.get('ruleta') as File | null },
        { key: 'speedrun', file: formData.get('speedrun') as File | null },
        { key: 'mines', file: formData.get('mines') as File | null },
    ];

    const filesToUpload = assetsToUpdate.filter(asset => asset.file && asset.file.size > 0);

    if (filesToUpload.length === 0) {
        return { success: false, message: 'No se seleccionaron nuevos archivos de imagen para actualizar.' };
    }

    try {
        const admin = await getFirebaseAdmin();
        const bucket = admin.storage().bucket();
        const urls: Record<string, string> = {};

        for (const { key, file } of filesToUpload) {
             if (!file) continue;
            const filePath = `game-assets/lobby/${key}-${Date.now()}.${file.name.split('.').pop()}`;
            const fileRef = bucket.file(filePath);
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            await fileRef.save(fileBuffer, {
                metadata: { contentType: file.type },
                public: true,
            });
            
            urls[key] = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        }
        
        const docRef = doc(db, ASSET_COLLECTION, CASINO_LOBBY_DOC);

        await setDoc(docRef, {
            ...urls,
            lastUpdated: serverTimestamp()
        }, { merge: true });

        revalidatePath('/admin/game-assets');
        revalidatePath('/casino');
        
        return { success: true, message: 'Las imágenes del lobby se han actualizado.' };

    } catch (error) {
        console.error('Error updating lobby assets:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        return { success: false, message: `No se pudo actualizar la imagen: ${errorMessage}` };
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
    
