

'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const ASSET_COLLECTION = 'game_assets';
const PENALTY_SHOOTOUT_DOC = 'penalty_shootout';
const CASINO_LOBBY_DOC = 'casino_lobby';
const MINES_DOC = 'mines';

export interface FormState {
    success: boolean;
    message: string;
}

export async function getPenaltyGameAssets(): Promise<Record<string, string | number>> {
    try {
        const docRef = doc(db, ASSET_COLLECTION, PENALTY_SHOOTOUT_DOC);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const { lastUpdated: _, ...assets } = data;
            return assets;
        }
        return {};
    } catch (error) {
        console.error("Error getting game assets:", error);
        return {};
    }
}

export async function getMinesGameAssets(): Promise<Record<string, string>> {
    try {
        const docRef = doc(db, ASSET_COLLECTION, MINES_DOC);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const { lastUpdated: _, ...assets } = data;
            return assets as Record<string, string>;
        }
        return {};
    } catch (error) {
        console.error("Error getting mines game assets:", error);
        return {};
    }
}

export async function getLobbyAssets(): Promise<Record<string, string>> {
    try {
        const docRef = doc(db, ASSET_COLLECTION, CASINO_LOBBY_DOC);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const { lastUpdated: _, ...assets } = data;
            return assets as Record<string, string>;
        }
        return {};
    } catch (error) {
        console.error("Error getting lobby assets:", error);
        return {};
    }
}


export async function updateLobbyAssets(prevState: FormState | undefined, formData: FormData): Promise<FormState> {
    const urls: Record<string, string> = {};
    const assetsToUpdate = ['penalty_shootout', 'ruleta', 'speedrun', 'mines'];

    assetsToUpdate.forEach(key => {
        const url = formData.get(key) as string | null;
        if (url && url.startsWith('http')) {
            urls[key] = url;
        }
    });

    if (Object.keys(urls).length === 0) {
        return { success: false, message: 'No se proporcionaron URLs de imagen válidas para actualizar.' };
    }

    try {
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


export async function updateGameAsset(prevState: FormState | undefined, formData: FormData): Promise<FormState> {
  const assetKey = formData.get('assetKey') as string | null;
  const assetImageUrl = formData.get('assetImageUrl') as string | null;
  const gameType = formData.get('gameType') as 'penalty_shootout' | 'mines';
  
  if (!assetKey || !gameType) {
    return { success: false, message: 'Falta la clave del recurso (assetKey) o el tipo de juego (gameType).' };
  }
  if (!assetImageUrl || !assetImageUrl.startsWith('http')) {
    return { success: false, message: 'La URL del recurso no es válida.' };
  }

  const documentMap = {
    penalty_shootout: PENALTY_SHOOTOUT_DOC,
    mines: MINES_DOC,
  };

  const docId = documentMap[gameType];
  
  const revalidatePaths = ['/admin/game-assets'];
  if (gameType === 'penalty_shootout') {
    revalidatePaths.push('/casino/penalty-shootout');
  } else if (gameType === 'mines') {
    revalidatePaths.push('/casino/mines');
  }


  try {
    const docRef = doc(db, ASSET_COLLECTION, docId);

    await setDoc(docRef, {
        [assetKey]: assetImageUrl,
        lastUpdated: serverTimestamp()
    }, { merge: true });

    revalidatePaths.forEach(p => revalidatePath(p));
    
    return { success: true, message: 'El recurso del juego se ha actualizado correctamente.' };

  } catch (error) {
    console.error('Error updating game asset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return { success: false, message: `No se pudo actualizar el recurso: ${errorMessage}` };
  }
}
