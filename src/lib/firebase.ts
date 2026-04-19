import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Interface para erros detalhados do Firestore conforme exigido pelas diretrizes.
 */
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

/**
 * Garante que o usuário esteja autenticado anonimamente para persistência segura no Firestore.
 * Se o provedor anônimo estiver desativado no console (erro admin-restricted-operation),
 * ele falha graciosamente permitindo que o app use um modo de fallback local.
 */
export async function ensureAuth(): Promise<User | { uid: string, isAnonymous: boolean, isLocalFallback: boolean }> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (error: any) {
          console.error("Auth error detail:", error);
          if (error.code === 'auth/admin-restricted-operation') {
            console.warn("Firebase Anonymous Auth is disabled in console. Falling back to local ID.");
            // Retorna um objeto que mimetiza um usuário para manter o app funcional localmente
            let localId = localStorage.getItem('finanflow_local_uid');
            if (!localId) {
              localId = 'local_' + Math.random().toString(36).substr(2, 9);
              localStorage.setItem('finanflow_local_uid', localId);
            }
            resolve({ uid: localId, isAnonymous: true, isLocalFallback: true });
          } else {
            // Em caso de outro erro, ainda tentamos manter o app vivo
            resolve({ uid: 'guest', isAnonymous: true, isLocalFallback: true });
          }
        }
      }
    });
  });
}

/**
 * Testa a conexão com o Firestore conforme exigido pelas diretrizes.
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}

testConnection();
