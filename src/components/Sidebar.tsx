import React from 'react';
import { 
  Home as HomeIcon, 
  Sparkles, HelpCircle as SupportIcon,
  Smartphone, Radar, Briefcase, Award,
  Youtube, Video, Facebook, Puzzle, Star
} from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  currentPage: string;
  activeFolderId: string | null;
  folders: any[];
  setCurrentPage: (page: string) => void;
  setActiveFolderId: (id: string | null) => void;
  createNewFolder: () => void;
  activeViralTab?: string;
  setActiveViralTab?: (tab: string) => void;
}

const SidebarItem: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-[#1a1a1a] text-[#D4AF37] font-black border-l-2 border-[#D4AF37]' 
        : 'text-white hover:text-zinc-100 hover:bg-[#121212]'
    }`}
  >
    <Icon size={16} className={active ? 'text-[#D4AF37]' : 'text-white'} />
    <span className="text-sm uppercase tracking-widest font-bold">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentModule, currentPage, setCurrentPage, setActiveFolderId,
  activeViralTab, setActiveViralTab
}) => {
  return (
    <aside className="w-60 bg-[#0a0a0a] border-r border-white/5 flex flex-col fixed h-[calc(100vh-65px)] bottom-0 left-0 z-40">
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        
        {currentModule === 'home' && (
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest px-4 mb-2">Visão Geral</p>
            <SidebarItem icon={HomeIcon} label="Dashboard" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
          </div>
        )}

        {/* --- 007 SWIPER --- */}
        {currentModule === 'swiper' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest px-4 mb-2">Inteligência</p>
              <SidebarItem icon={Briefcase} label="OFERTAS VALIDADAS" active={currentPage === 'cofre'} onClick={() => { setCurrentPage('cofre'); setActiveFolderId(null); }} />
              <SidebarItem icon={Facebook} label="BIBLIOTECA FACEBOOK" active={currentPage === 'biblioteca'} onClick={() => { setCurrentPage('biblioteca'); setActiveFolderId(null); }} />
              <SidebarItem icon={Radar} label="INTERCEPTADOR WEB" active={currentPage === 'interceptador'} onClick={() => { setCurrentPage('interceptador'); setActiveFolderId(null); }} />
              <SidebarItem icon={Puzzle} label="EXTENSÃO DE CAPTURA" active={currentPage === 'extensao'} onClick={() => { setCurrentPage('extensao'); setActiveFolderId(null); }} />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest px-4 mb-2">FAVORITOS</p>
              <SidebarItem icon={Star} label="FAVORITOS" active={currentPage === 'favoritos'} onClick={() => { setCurrentPage('favoritos'); setActiveFolderId(null); }} />
            </div>
          </div>
        )}

        {/* --- VIRAIS ORGÂNICOS --- */}
        {currentModule === 'organicos' && (
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest px-4 mb-2">Redes de Mineração</p>
            <SidebarItem 
              icon={Smartphone} 
              label="TikTok Trends" 
              active={currentPage === 'virais' && activeViralTab === 'TIKTOK'} 
              onClick={() => { setCurrentPage('virais'); if (setActiveViralTab) setActiveViralTab('TIKTOK'); }} 
            />
            <SidebarItem 
              icon={Video} 
              label="Instagram Reels" 
              active={currentPage === 'virais' && activeViralTab === 'REELS'} 
              onClick={() => { setCurrentPage('virais'); if (setActiveViralTab) setActiveViralTab('REELS'); }} 
            />
            <SidebarItem 
              icon={Youtube} 
              label="YouTube Shorts" 
              active={currentPage === 'virais' && activeViralTab === 'SHORTS'} 
              onClick={() => { setCurrentPage('virais'); if (setActiveViralTab) setActiveViralTab('SHORTS'); }} 
            />
          </div>
        )}

        {/* --- LAB I.A. --- */}
        {currentModule === 'lab_ia' && (
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest px-4 mb-2">Ferramentas I.A.</p>
            <SidebarItem icon={Sparkles} label="LAB I.A." active={currentPage === 'lab'} onClick={() => setCurrentPage('lab')} />
          </div>
        )}

        {/* --- LAB DE EXPERT --- */}
        {currentModule === 'lab_expert' && (
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest px-4 mb-2">Estrategista Oculto</p>
            <SidebarItem icon={Award} label="LAB DE EXPERT" active={currentPage === 'expert'} onClick={() => setCurrentPage('expert')} />
          </div>
        )}

        {/* --- CENTRAL 007 --- */}
        {currentModule === 'central' && (
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest px-4 mb-2">Base de Suporte</p>
            <SidebarItem icon={SupportIcon} label="Suporte Técnico" active={currentPage === 'suporte'} onClick={() => setCurrentPage('suporte')} />
          </div>
        )}
      </div>
    </aside>
  );
};