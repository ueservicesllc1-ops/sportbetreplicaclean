
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const SETTINGS_COLLECTION = 'site_settings';
const BANKING_DOC = 'banking_info';

export interface BankingInfo {
    bankName?: string;
    accountHolder?: string;
    ruc?: string;
    accountType?: string;
    accountNumber?: string;
    email?: string;
    whatsapp?: string;
    logoPichincha?: string;
    logoGuayaquil?: string;
    logoInternacional?: string;
    logoPacifico?: string;
}

export interface BankingSettingsState {
    success: boolean;
    message: string;
}


export async function getBankingSettings(): Promise<BankingInfo> {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, BANKING_DOC);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // We need to remove it before passing the object to a Client Component.
            const { lastUpdated: _, ...settings } = data;
            return settings as BankingInfo;
        }
        return {};
    } catch (error) {
        console.error("Error getting banking settings:", error);
        return {};
    }
}


export async function updateBankingSettings(prevState: BankingSettingsState | undefined, formData: FormData): Promise<BankingSettingsState> {
    
    const dataToSave: BankingInfo = {
        bankName: formData.get('bankName') as string,
        accountHolder: formData.get('accountHolder') as string,
        ruc: formData.get('ruc') as string,
        accountType: formData.get('accountType') as string,
        accountNumber: formData.get('accountNumber') as string,
        email: formData.get('email') as string,
        whatsapp: formData.get('whatsapp') as string,
        logoPichincha: formData.get('logoPichincha') as string,
        logoGuayaquil: formData.get('logoGuayaquil') as string,
        logoInternacional: formData.get('logoInternacional') as string,
        logoPacifico: formData.get('logoPacifico') as string,
    };

    // Basic validation
    if (!dataToSave.bankName || !dataToSave.accountNumber) {
        return { success: false, message: 'El nombre del banco y el número de cuenta son obligatorios.' };
    }

    try {
        const docRef = doc(db, SETTINGS_COLLECTION, BANKING_DOC);
        await setDoc(docRef, { ...dataToSave, lastUpdated: serverTimestamp() }, { merge: true });

        revalidatePath('/admin/banking');
        revalidatePath('/wallet'); // Revalidate wallet to show new info

        return { success: true, message: 'La configuración bancaria se ha actualizado correctamente.' };

    } catch (error) {
        console.error('Error updating banking settings:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        return { success: false, message: `No se pudo guardar la configuración: ${errorMessage}` };
    }
}
