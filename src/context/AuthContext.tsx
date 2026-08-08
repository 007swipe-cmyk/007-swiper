import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginError: string;
  setLoginError: (error: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  firstAccess: (email: string, password: string) => Promise<boolean>;
  recoverPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const checkEmailInFirestore = async (emailClean: string) => {
  const emailLower = emailClean.toLowerCase();
  
  // Try document ID (lowercase email)
  const docRef = doc(db, 'agentes', emailLower);
  let docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { exists: true, data: docSnap.data(), docId: docSnap.id };
  }
  
  // Try document ID with original email case
  const docRefOriginal = doc(db, 'agentes', emailClean);
  docSnap = await getDoc(docRefOriginal);
  if (docSnap.exists()) {
    return { exists: true, data: docSnap.data(), docId: docSnap.id };
  }

  // Query by email field (case insensitive lookups)
  const agentesRef = collection(db, 'agentes');
  const q1 = query(agentesRef, where('email', '==', emailLower));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) {
    return { exists: true, data: snap1.docs[0].data(), docId: snap1.docs[0].id };
  }

  const q2 = query(agentesRef, where('email', '==', emailClean));
  const snap2 = await getDocs(q2);
  if (!snap2.empty) {
    return { exists: true, data: snap2.docs[0].data(), docId: snap2.docs[0].id };
  }

  return { exists: false, data: null, docId: null };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('007_SWIPER_MASTER_LOCKDOWN') === 'true';
    } catch {
      return false;
    }
  });
  const [loginError, setLoginError] = useState('');

  // Periodically check if standard user is still active in Firestore
  const verifyCurrentUserStatus = async (emailToCheck: string) => {
    const emailClean = emailToCheck.trim();
    if (emailClean.toLowerCase() === '007swipe@gmail.com') {
      return;
    }

    try {
      const { exists, data } = await checkEmailInFirestore(emailClean);
      if (!exists || !data || data.ativo !== true) {
        // Deauthorize
        localStorage.removeItem('007_SWIPER_MASTER_LOCKDOWN');
        localStorage.removeItem('007_swiper_email');
        await firebaseSignOut(auth);
        setUser(null);
        setIsAuthenticated(false);
        setLoginError('Sua assinatura está inativa ou expirada. Entre em contato com o suporte.');
      }
    } catch (error) {
      console.error('Error verifying user status:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);
        if (firebaseUser.email) {
          localStorage.setItem('007_swiper_email', firebaseUser.email);
          await verifyCurrentUserStatus(firebaseUser.email);
        }
      } else {
        setUser(null);
        // Do not automatically set isAuthenticated to false if localStorage is set
        // (to preserve Master session status if they log in via localStorage logic)
        if (localStorage.getItem('007_SWIPER_MASTER_LOCKDOWN') !== 'true') {
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoginError('');
    const emailClean = email.trim();
    const emailLower = emailClean.toLowerCase();

    // 1. Master account check
    if (emailLower === '007swipe@gmail.com') {
      if (password === 'agente-01') {
        localStorage.setItem('007_SWIPER_MASTER_LOCKDOWN', 'true');
        localStorage.setItem('007_swiper_email', emailLower);
        setIsAuthenticated(true);
        return true;
      } else {
        setLoginError('Credenciais inválidas ou acesso revogado.');
        return false;
      }
    }

    // 2. Standard user check
    try {
      const { exists, data, docId } = await checkEmailInFirestore(emailClean);

      if (!exists || !data || data.ativo !== true) {
        setLoginError('Acesso negado. Assinatura inativa ou e-mail não autorizado.');
        return false;
      }

      // If document exists and active === true, try standard firebase login
      await signInWithEmailAndPassword(auth, emailClean, password);
      
      // Update ultimo_acesso in Firestore
      if (docId) {
        try {
          const docRef = doc(db, 'agentes', docId);
          await updateDoc(docRef, {
            ultimo_acesso: new Date()
          });
        } catch (dbErr) {
          console.error("Error updating ultimo_acesso field:", dbErr);
        }
      }

      localStorage.setItem('007_SWIPER_MASTER_LOCKDOWN', 'true');
      localStorage.setItem('007_swiper_email', emailClean);
      setIsAuthenticated(true);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setLoginError('Credenciais inválidas ou acesso revogado.');
      } else {
        setLoginError('Acesso negado. Assinatura inativa ou e-mail não autorizado.');
      }
      return false;
    }
  };

  const firstAccess = async (email: string, password: string): Promise<boolean> => {
    setLoginError('');
    const emailClean = email.trim();
    const emailLower = emailClean.toLowerCase();

    if (emailLower === '007swipe@gmail.com') {
      setLoginError('Este e-mail já possui cadastro. Use a aba "Entrar" com sua senha.');
      return false;
    }

    try {
      const { exists, data } = await checkEmailInFirestore(emailClean);

      if (!exists || !data || data.ativo !== true) {
        setLoginError('E-mail não encontrado ou inativo. Contate o suporte.');
        return false;
      }

      await createUserWithEmailAndPassword(auth, emailClean, password);
      localStorage.setItem('007_SWIPER_MASTER_LOCKDOWN', 'true');
      localStorage.setItem('007_swiper_email', emailClean);
      setIsAuthenticated(true);
      return true;
    } catch (error: any) {
      console.error('First access registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setLoginError('Este e-mail já possui cadastro. Use a aba "Entrar" com sua senha.');
      } else {
        setLoginError(error.message || 'Erro ao realizar primeiro acesso.');
      }
      return false;
    }
  };

  const recoverPassword = async (email: string): Promise<boolean> => {
    setLoginError('');
    const emailClean = email.trim();

    try {
      const { exists, data } = await checkEmailInFirestore(emailClean);

      if (!exists || !data || data.ativo !== true) {
        setLoginError('E-mail não encontrado ou inativo. Contate o suporte.');
        return false;
      }

      await sendPasswordResetEmail(auth, emailClean);
      return true;
    } catch (error: any) {
      console.error('Password reset error:', error);
      setLoginError(error.message || 'Erro ao enviar instruções de recuperação.');
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem('007_SWIPER_MASTER_LOCKDOWN');
    localStorage.removeItem('007_swiper_email');
    await firebaseSignOut(auth);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated, 
      loginError, 
      setLoginError, 
      login, 
      firstAccess, 
      recoverPassword, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
