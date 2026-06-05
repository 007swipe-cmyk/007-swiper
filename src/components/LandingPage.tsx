import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, Check, X, MessageCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface LandingPageProps {
  onLogin: () => void;
  onRouteToAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRouteToAdmin }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);
    setAdminLoginError('');
    try {
      await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPassword);
      setShowAdminLoginModal(false);
      onRouteToAdmin();
    } catch (error) {
      console.error('Admin login error:', error);
      setAdminLoginError('Acesso Administrador Negado');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleFooterDoubleClick = () => {
    if (auth.currentUser || localStorage.getItem('swiper_authenticated') === 'true') {
      onRouteToAdmin();
    } else {
      setShowAdminLoginModal(true);
    }
  };
  const [agentEmail, setAgentEmail] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'firstAccess'>('login');
  
  // Checkout URL logic depending on search parameter 'ref'
  const [isHotmart, setIsHotmart] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsHotmart(params.get('ref') === 'hot');
  }, []);

  const checkoutUrls = {
    mensal: isHotmart 
      ? '#hotmart-mensal-pendente' 
      : 'https://pay.kiwify.com.br/mtU9l7e',
    trimestral: isHotmart 
      ? '#hotmart-trimestral-pendente' 
      : 'https://pay.kiwify.com.br/ExDtrjE',
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    const emailClean = agentEmail.trim();

    if (authTab === 'login') {
      try {
        await signInWithEmailAndPassword(auth, emailClean, agentPassword);
        onLogin();
      } catch (error) {
        console.error('Login error:', error);
        setLoginError('Acesso Negado');
      } finally {
        setIsLoading(false);
      }
    } else {
      // PRIMEIRO ACESSO FLOW
      try {
        // 1. Query Firestore agentes collection
        const docRef1 = doc(db, 'agentes', emailClean);
        const docRef2 = doc(db, 'agentes', emailClean.toLowerCase());
        const docSnap1 = await getDoc(docRef1);
        const docSnap2 = await getDoc(docRef2);
        
        let existsAndActive = false;
        let foundData = null;
        if (docSnap1.exists()) {
          foundData = docSnap1.data();
        } else if (docSnap2.exists()) {
          foundData = docSnap2.data();
        }
        
        if (foundData) {
          if (foundData.ativo === true) {
            existsAndActive = true;
          }
        } else {
          // Fallback: Query by email field
          const agentesRef = collection(db, 'agentes');
          const q1 = query(agentesRef, where('email', '==', emailClean));
          const q2 = query(agentesRef, where('email', '==', emailClean.toLowerCase()));
          const snap1 = await getDocs(q1);
          const snap2 = await getDocs(q2);
          
          if (!snap1.empty) {
            const data = snap1.docs[0].data();
            if (data && data.ativo === true) {
              existsAndActive = true;
            }
          } else if (!snap2.empty) {
            const data = snap2.docs[0].data();
            if (data && data.ativo === true) {
              existsAndActive = true;
            }
          }
        }

        if (!existsAndActive) {
          setLoginError('E-mail não encontrado ou inativo. Contate o suporte.');
          setIsLoading(false);
          return;
        }

        // 2. Create the user with email and chosen password in Firebase Auth
        await createUserWithEmailAndPassword(auth, emailClean, agentPassword);
        onLogin(); // Log them in automatically on success
      } catch (error: any) {
        console.error('First access registration error:', error);
        if (error.code === 'auth/email-already-in-use') {
          setLoginError('Este e-mail já possui cadastro. Use a aba "Entrar" com sua senha.');
        } else {
          setLoginError(error.message || 'Erro ao realizar primeiro acesso.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRecoverId = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('RECUPERAÇÃO DE CREDENCIAIS:\n\nPor favor, envie um e-mail para suporte@007swiper.com ou verifique sua senha de agente enviada no manual de instruções de compra.');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans antialiased relative overflow-x-hidden selection:bg-[#D4AF37]/30 selection:text-[#D4AF37]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4AF37]/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#D4AF37]/2 blur-[150px] pointer-events-none"></div>

      {/* HEADER */}
      <header className="h-[75px] border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 left-0 w-full z-40 flex items-center justify-between px-6 md:px-12 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="bg-[#D4AF37] p-2 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.25)]">
            <ShieldCheck className="text-black" size={22} />
          </div>
          <span className="text-xl font-black tracking-widest text-white uppercase italic">
            007 <span className="text-[#D4AF37]">SWIPER</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={handleRecoverId} 
            className="text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            RECUPERAR ID
          </button>
          <button 
            onClick={() => { setShowLoginModal(true); setLoginError(''); setAgentEmail(''); setAgentPassword(''); setIsLoading(false); }}
            className="bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-widest py-2.5 px-6 rounded-lg text-xs transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.2)] hover:shadow-[0_4px_25px_rgba(255,255,255,0.25)] active:scale-[0.98] cursor-pointer"
          >
            ENTRAR
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20 text-center space-y-8 relative">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
          <span className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">
            INTELIGÊNCIA DE MERCADO EM TEMPO REAL
          </span>
        </div>

        {/* Massive Headline */}
        <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tight leading-none max-w-5xl mx-auto font-sans">
          ACESSE SEM LIMITES AS OFERTAS MAIS LUCRATIVAS E ESCALADAS DO MERCADO DE RESPOSTA DIRETA <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFFDD0] to-[#D4AF37] drop-shadow-[0_2px_15px_rgba(212,175,55,0.15)]">ANTES DA CONCORRÊNCIA.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-zinc-400 text-sm md:text-lg max-w-3xl mx-auto font-medium leading-relaxed">
          Rastreie, analise e modele VSLs, criativos e funis que estão gerando milhões em YouTube Ads, Facebook Ads e TikTok Ads. O fim do achismo na sua escala digital.
        </p>

        {/* Video Placeholder */}
        <div className="pt-6 max-w-4xl mx-auto">
          <div className="aspect-video bg-gradient-to-b from-[#0a0a0a] to-[#050505] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-500 cursor-pointer">
            {/* Inner background grid glow */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#D4AF37]/8 transition-all duration-500"></div>

            {/* Premium Gold Play Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform duration-300 z-10">
              <Play size={26} className="fill-current ml-1" />
            </div>

            <span className="mt-6 text-[10px] md:text-xs font-black tracking-widest text-zinc-300 uppercase max-w-md text-center leading-relaxed z-10 transition-colors group-hover:text-white">
              DESCUBRA COMO RASTREAMOS E ORGANIZAMOS OFERTAS ESCALADAS EM TEMPO REAL
            </span>
          </div>
        </div>
      </section>

      {/* PRICING & PLANS SECTION */}
      <section className="border-t border-white/5 bg-[#080808] py-24 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-wider">PLANOS DE ACESSO EXCLUSIVO</h2>
            <p className="text-zinc-500 text-xs md:text-sm font-bold uppercase tracking-widest">Escolha a melhor licença para a sua operação de espionagem tática</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* PLANO MENSAL */}
            <div className="bg-[#0a0a0a]/60 border border-white/5 rounded-2xl p-8 flex flex-col justify-between hover:border-[#D4AF37]/20 transition-all duration-300 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/1 rounded-full blur-3xl pointer-events-none"></div>
              
              <div>
                <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase block mb-2">LICENÇA MENSAL</span>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-black tracking-tight">R$ 197</span>
                  <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">/ Mês</span>
                </div>

                <div className="border-t border-white/5 pt-6 mb-8">
                  <ul className="space-y-4">
                    {[
                      'Acesso completo ao 007 Swiper',
                      'Radar de Ofertas Escaladas (Real-Time)',
                      'Acesso à Central de Virais Orgânicos',
                      'Mapeamento de VSLs, Criativos e Checkouts',
                      'Histórico de Ofertas Salvas (Favoritos)',
                      'Suporte Técnico Operacional',
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-zinc-400 text-xs">
                        <Check size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <a 
                href={checkoutUrls.mensal}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-zinc-900 hover:bg-[#D4AF37] hover:text-black text-white font-black uppercase tracking-widest text-center py-4 rounded-xl text-xs transition-all duration-300 border border-white/10 hover:border-transparent active:scale-[0.98] cursor-pointer"
              >
                ASSINAR LICENÇA MENSAL
              </a>
            </div>

            {/* PLANO TRIMESTRAL */}
            <div className="bg-[#0c0c0c] border-2 border-[#D4AF37] rounded-2xl p-8 flex flex-col justify-between shadow-[0_0_35px_rgba(212,175,55,0.06)] relative overflow-hidden group">
              {/* Highlight Glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Economize Badge */}
              <div className="absolute top-5 right-5 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
                ECONOMIZE R$ 94
              </div>
              
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase block mb-2">LICENÇA TRIMESTRAL</span>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-black tracking-tight text-white">R$ 497</span>
                  <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">/ Trimestre</span>
                </div>

                <div className="border-t border-[#D4AF37]/20 pt-6 mb-8">
                  <ul className="space-y-4">
                    {[
                      'Acesso completo ao 007 Swiper',
                      'Radar de Ofertas Escaladas (Real-Time)',
                      'Acesso à Central de Virais Orgânicos',
                      'Mapeamento de VSLs, Criativos e Checkouts',
                      'Acesso Completo ao Modelador de Copy (Lab I.A)',
                      'Acesso ao Lab de Expert (Incubadora)',
                      'Glow de Membro Trimestral na Plataforma',
                      'Suporte Prioritário VIP',
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-zinc-300 text-xs">
                        <Check size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <a 
                href={checkoutUrls.trimestral}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-widest text-center py-4 rounded-xl text-xs transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:shadow-2xl active:scale-[0.98] cursor-pointer"
              >
                ASSINAR LICENÇA TRIMESTRAL
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* GUARANTEE SECTION */}
      <section className="py-20 max-w-5xl mx-auto px-6 relative">
        <div className="bg-gradient-to-r from-[#0a0a0a] to-[#070707] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden group hover:border-[#D4AF37]/10 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/2 rounded-full blur-3xl pointer-events-none"></div>

          {/* Guarantee Gold Seal */}
          <div className="shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#D4AF37]/20 flex flex-col items-center justify-center relative bg-black shadow-2xl shadow-[#D4AF37]/5 shrink-0 group-hover:scale-105 transition-transform duration-300 select-none">
            {/* Dashed outer border */}
            <div className="absolute inset-1 rounded-full border border-dashed border-[#D4AF37]/30"></div>
            <span className="text-3xl md:text-4xl font-black text-[#D4AF37] tracking-tighter leading-none">7 DIAS</span>
            <span className="text-[8px] md:text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">GARANTIA</span>
          </div>

          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">GARANTIA INCONDICIONAL DE 7 DIAS</h3>
            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed font-medium">
              Estamos tão seguros da qualidade da nossa plataforma que oferecemos uma garantia de reembolso de 100% de até 7 dias após a sua assinatura. Se por qualquer motivo você achar que a inteligência do 007 Swiper não serve para a sua operação, devolvemos cada centavo do seu dinheiro, sem burocracia.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 text-center bg-[#030303] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <p 
            className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest select-none"
          >
            © 2026 007 SWIPER INTELLIGENCE PLATFORM. TODOS OS DIREITOS RESERVADOS.
          </p>
          <div
            onDoubleClick={handleFooterDoubleClick}
            className="w-[100px] h-[100px] mx-auto mt-2 relative z-50 cursor-default select-none"
            style={{ opacity: 0 }}
          />
        </div>
      </footer>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/5527997333662?text=Olá! Gostaria de tirar algumas dúvidas sobre a plataforma 007 Swiper."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_4px_25px_rgba(37,211,102,0.35)] hover:scale-110 active:scale-95 transition-all duration-300 z-40 group cursor-pointer"
        title="Falar com o Suporte Operacional"
      >
        <MessageCircle size={28} className="fill-current" />
        <span className="absolute right-16 bg-[#0a0a0a] border border-white/10 text-white font-black uppercase tracking-widest text-[9px] py-1.5 px-3 rounded-md shadow-2xl opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all origin-right pointer-events-none whitespace-nowrap">
          SUPORTE ONLINE
        </span>
      </a>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 relative shadow-[0_0_50px_rgba(212,175,55,0.05)]">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center gap-3 mb-6">
              <div className="bg-[#D4AF37]/10 p-3 rounded-full text-[#D4AF37] border border-[#D4AF37]/20">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-base font-black tracking-widest uppercase">AUTENTICAÇÃO DO AGENTE</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Insira suas credenciais operacionais</p>
            </div>

            {/* TABS SELECTOR */}
            <div className="flex border-b border-white/5 mb-6">
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setLoginError(''); setAgentEmail(''); setAgentPassword(''); }}
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
                onClick={() => { setAuthTab('firstAccess'); setLoginError(''); setAgentEmail(''); setAgentPassword(''); }}
                className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  authTab === 'firstAccess'
                    ? 'border-b-2 border-[#D4AF37] text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                PRIMEIRO ACESSO
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                  {authTab === 'login' ? 'E-MAIL DO AGENTE' : 'E-MAIL PARA ATIVAÇÃO'}
                </label>
                <input 
                  type="email"
                  placeholder="EX: AGENTE@007SWIPER.COM"
                  value={agentEmail}
                  onChange={(e) => setAgentEmail(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded-lg py-3 px-4 text-xs tracking-widest text-center text-[#D4AF37] font-black focus:border-[#D4AF37]/65 outline-none placeholder:text-zinc-800 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                  {authTab === 'login' ? 'SENHA DE CREDENCIAMENTO' : 'ESCOLHA UMA SENHA SEGURA'}
                </label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={agentPassword}
                  onChange={(e) => setAgentPassword(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded-lg py-3 px-4 text-xs tracking-widest text-center text-[#D4AF37] font-black focus:border-[#D4AF37]/65 outline-none placeholder:text-zinc-800 transition-all"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-[9px] font-black uppercase tracking-wider text-center">
                  {loginError}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-widest py-3.5 rounded-lg text-xs transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.2)] hover:shadow-2xl active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading 
                  ? (authTab === 'login' ? 'AUTENTICANDO...' : 'CADASTRANDO...') 
                  : (authTab === 'login' ? 'DESBLOQUEAR ACESSO' : 'ATIVAR PRIMEIRO ACESSO')
                }
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EASTER EGG ADMIN LOGIN MODAL */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#080808] border-2 border-[#D4AF37]/30 rounded-2xl p-6 relative shadow-[0_0_50px_rgba(212,175,55,0.1)]">
            <button 
              onClick={() => setShowAdminLoginModal(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="text-center mb-6">
              <span className="text-[8px] font-black tracking-widest text-[#D4AF37] uppercase block mb-1">MÓDULO DE SEGURANÇA</span>
              <h3 className="text-sm font-black tracking-widest uppercase text-white">AUTENTICAÇÃO TÁTICA MASTER</h3>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Insira as credenciais do administrador</p>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">E-MAIL MASTER</label>
                <input 
                  type="email"
                  placeholder="EX: ADMIN@007SWIPER.COM"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-[#050505] border border-[#D4AF37]/20 rounded-lg py-3 px-4 text-xs tracking-widest text-center text-[#D4AF37] font-black focus:border-[#D4AF37] outline-none placeholder:text-zinc-800 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-2">SENHA DE CREDENCIAMENTO</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#050505] border border-[#D4AF37]/20 rounded-lg py-3 px-4 text-xs tracking-widest text-center text-[#D4AF37] font-black focus:border-[#D4AF37] outline-none placeholder:text-zinc-800 transition-all"
                  required
                />
              </div>

              {adminLoginError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-[9px] font-black uppercase tracking-wider text-center">
                  {adminLoginError}
                </div>
              )}

              <button 
                type="submit"
                disabled={isAdminLoading}
                className="w-full bg-zinc-900 hover:bg-[#D4AF37] hover:text-black border border-white/10 hover:border-transparent text-white font-black uppercase tracking-widest py-3 rounded-lg text-[10px] transition-all cursor-pointer disabled:opacity-50"
              >
                {isAdminLoading ? 'CONECTANDO...' : 'DESBLOQUEAR ACESSO MASTER'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
