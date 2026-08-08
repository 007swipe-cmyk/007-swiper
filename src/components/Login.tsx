import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
  onRouteToAdmin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ isOpen, onClose, onLogin, onRouteToAdmin }) => {
  const { login, firstAccess, recoverPassword, loginError, setLoginError } = useAuth();
  const [authTab, setAuthTab] = useState<'login' | 'firstAccess'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(false);
    setLoginError('');
    setSuccessMessage('');
    const emailClean = email.trim();

    if (authTab === 'login') {
      setIsLoading(true);
      const success = await login(emailClean, password);
      setIsLoading(false);
      if (success) {
        if (emailClean.toLowerCase() === '007swipe@gmail.com') {
          onRouteToAdmin(emailClean);
        } else {
          onLogin(emailClean);
        }
        onClose();
      }
    } else {
      // First Access
      setIsLoading(true);
      const success = await firstAccess(emailClean, password);
      setIsLoading(false);
      if (success) {
        onLogin(emailClean);
        onClose();
      }
    }
  };

  const handleForgotPassword = async () => {
    setLoginError('');
    setSuccessMessage('');
    const emailClean = email.trim();
    if (!emailClean) {
      setLoginError('Por favor, insira seu e-mail para recuperar a senha.');
      return;
    }

    setIsLoading(true);
    const success = await recoverPassword(emailClean);
    setIsLoading(false);

    if (success) {
      setSuccessMessage('Instruções enviadas para o seu e-mail de compra!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-300 font-sans">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 relative shadow-[0_0_50px_rgba(212,175,55,0.05)]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Logo and Icon */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="bg-[#D4AF37]/10 p-3 rounded-full text-[#D4AF37] border border-[#D4AF37]/20">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-base font-black tracking-widest uppercase text-white">AUTENTICAÇÃO DO AGENTE</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Insira suas credenciais operacionais</p>
        </div>

        {/* Tabs Selector */}
        <div className="flex border-b border-white/5 mb-6">
          <button
            type="button"
            onClick={() => { 
              setAuthTab('login'); 
              setLoginError(''); 
              setSuccessMessage('');
              setEmail(''); 
              setPassword(''); 
            }}
            className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              authTab === 'login'
                ? 'border-b-2 border-[#D4AF37] text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            ENTRAR
          </button>
          <button
            type="button"
            onClick={() => { 
              setAuthTab('firstAccess'); 
              setLoginError(''); 
              setSuccessMessage('');
              setEmail(''); 
              setPassword(''); 
            }}
            className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              authTab === 'firstAccess'
                ? 'border-b-2 border-[#D4AF37] text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            PRIMEIRO ACESSO / ESQUECI A SENHA
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">
              {authTab === 'login' ? 'E-MAIL DO AGENTE' : 'E-MAIL DE COMPRA'}
            </label>
            <input 
              type="email"
              placeholder="EX: AGENTE@007SWIPER.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded-lg py-3 px-4 text-xs tracking-widest text-center text-[#D4AF37] font-black focus:border-[#D4AF37]/65 outline-none placeholder:text-zinc-800 transition-all uppercase"
              required
            />
          </div>

          {/* Password only required/shown for ENTRAR and optional/shown for first access setting */}
          <div>
            <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">
              {authTab === 'login' ? 'SENHA DE CREDENCIAMENTO' : 'ESCOLHA UMA SENHA SEGURA (PRIM. ACESSO)'}
            </label>
            <input 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded-lg py-3 px-4 text-xs tracking-widest text-center text-[#D4AF37] font-black focus:border-[#D4AF37]/65 outline-none placeholder:text-zinc-800 transition-all"
              required={authTab === 'login'}
            />
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-[9px] font-black uppercase tracking-wider text-center">
              {loginError}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded text-[9px] font-black uppercase tracking-wider text-center">
              {successMessage}
            </div>
          )}

          <div className="space-y-3 pt-2">
            {authTab === 'login' ? (
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-widest py-3.5 rounded-lg text-xs transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.2)] hover:shadow-2xl active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'AUTENTICANDO...' : 'DESBLOQUEAR ACESSO'}
              </button>
            ) : (
              <>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-widest py-3.5 rounded-lg text-xs transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.2)] hover:shadow-2xl active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'CADASTRANDO...' : 'ATIVAR PRIMEIRO ACESSO'}
                </button>
                
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="w-full bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white font-black uppercase tracking-widest py-3 rounded-lg text-[10px] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'ENVIANDO...' : 'ESQUECI A SENHA / RECUPERAR'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
