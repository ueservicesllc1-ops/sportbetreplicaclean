
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { VerificationStatus } from '@/contexts/auth-context';
import { revalidatePath } from 'next/cache';

export async function processVerification(userId: string, action: 'approve' | 'reject') {
    if (!userId || !action) {
        throw new Error('ID de usuario y acción son requeridos.');
    }

    // This should also be protected by checking the caller's role (isAdmin)
    // and with Firestore security rules.
    const userDocRef = doc(db, 'users', userId);
    const newStatus: VerificationStatus = action === 'approve' ? 'verified' : 'rejected';

    try {
        await updateDoc(userDocRef, {
            verificationStatus: newStatus
        });
        
        revalidatePath('/admin/verifications');
        revalidatePath('/admin/users');

    } catch (error) {
        console.error("Error processing verification:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('No se pudo procesar la solicitud de verificación.');
    }
}
