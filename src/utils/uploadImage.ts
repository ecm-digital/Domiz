
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, storage } from "../firebase";

type UploadImageOptions = {
    timeoutMs?: number;
    onProgress?: (progress: number) => void;
};

const uploadErrorMessage = (error: unknown) => {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === 'storage/quota-exceeded') return 'Limit Firebase Storage został przekroczony. Sprawdź rozliczenia i limit miejsca w Firebase.';
    if (code === 'storage/unauthorized') return 'Brak uprawnień do wgrywania zdjęć. Odśwież panel i zaloguj się ponownie.';
    if (code === 'storage/retry-limit-exceeded') return 'Firebase nie odpowiedział na czas. Sprawdź połączenie i spróbuj ponownie.';
    if (code === 'storage/canceled') return 'Wgrywanie zdjęcia zostało przerwane.';
    return error instanceof Error ? error.message : 'Nie udało się wgrać zdjęcia.';
};

export const uploadImage = async (file: File, path: string, options: UploadImageOptions = {}): Promise<string> => {
    if (!file.type.startsWith('image/')) {
        throw new Error('Wybierz plik graficzny w formacie JPG, PNG lub WEBP.');
    }
    if (file.size > 15 * 1024 * 1024) {
        throw new Error('Zdjęcie jest zbyt duże. Maksymalny rozmiar to 15 MB.');
    }

    const user = auth.currentUser;
    if (!user) {
        throw new Error('Sesja logowania wygasła. Odśwież panel i zaloguj się ponownie.');
    }

    // Odśwież token przed wysłaniem pliku — Storage wymaga aktualnej sesji Firebase.
    await user.getIdToken(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'zdjecie.jpg';
    const storageRef = ref(storage, `${path}/${crypto.randomUUID()}_${safeName}`);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    return await new Promise<string>((resolve, reject) => {
        const timeout = globalThis.setTimeout(() => {
            task.cancel();
            reject(new Error(`Wgrywanie pliku „${file.name}” trwało zbyt długo i zostało przerwane. Spróbuj ponownie.`));
        }, options.timeoutMs ?? 90_000);

        task.on('state_changed',
            (snapshot) => {
                const progress = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
                options.onProgress?.(progress);
            },
            (error) => {
                globalThis.clearTimeout(timeout);
                reject(new Error(uploadErrorMessage(error)));
            },
            async () => {
                globalThis.clearTimeout(timeout);
                try {
                    options.onProgress?.(100);
                    resolve(await getDownloadURL(task.snapshot.ref));
                } catch (error) {
                    reject(new Error(uploadErrorMessage(error)));
                }
            },
        );
    });
};
