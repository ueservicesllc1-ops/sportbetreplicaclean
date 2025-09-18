
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function updateUserVerification(prevState: any, formData: FormData) {
    const uid = formData.get('uid') as string | null;
    if (!uid) {
         return { success: false, message: 'Error de autenticación. No se pudo obtener el ID de usuario.' };
    }

    const realName = formData.get('realName') as string | null;
    const idNumber = formData.get('idNumber') as string | null;
    const idPhoto = formData.get('idPhoto') as File | null;
    

    if (!realName || realName.trim().length < 3) {
        return { success: false, message: 'El nombre es requerido y debe tener al menos 3 caracteres.' };
    }
    if (!idNumber || idNumber.trim().length < 5) {
        return { success: false, message: 'El número de ID es requerido y debe tener al menos 5 caracteres.' };
    }
    if (!idPhoto || idPhoto.size === 0) {
        return { success: false, message: 'La foto del ID es requerida.' };
    }

    try {
        const admin = await getFirebaseAdmin();
        const bucket = admin.storage().bucket();
        const filePath = `user-documents/${uid}/${Date.now()}-${idPhoto.name}`;
        const file = bucket.file(filePath);
        const fileBuffer = Buffer.from(await idPhoto.arrayBuffer());

        // Upload the file and make it public
        await file.save(fileBuffer, {
            metadata: { 
                contentType: idPhoto.type,
            },
            public: true,
        });
        
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        
        const userDocRef = doc(db, 'users', uid);

        await updateDoc(userDocRef, {
            realName: realName,
            idNumber: idNumber,
            idPhotoUrl: publicUrl,
            verificationStatus: 'pending'
        });
        
        revalidatePath('/wallet');
        revalidatePath('/admin/verifications');
        return { success: true, message: 'Documentos enviados para verificación.' };

    } catch (error) {
        console.error('Error updating user verification', error);
        const errorMessage = error instanceof Error ? error.message : 'No se pudo actualizar la información de verificación.';
        return { success: false, message: errorMessage };
    }
}
