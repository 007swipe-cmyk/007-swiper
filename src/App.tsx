import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Sparkles, HelpCircle, HomeIcon, 
  ShieldCheck, MessageCircle, Search, Star, FileText, ExternalLink,
  FolderOpen, Youtube, Facebook, Target, Radar, Download, Briefcase, Puzzle,
  LogOut, Video, Flame
} from 'lucide-react';
import { OfferDetails } from './components/OfferDetails';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AdLibrary } from './components/AdLibrary';
import { TelemetryHUD } from './components/TelemetryHUD';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';


const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR6N1u2xV-Of_muP_LJY9OGC77qXDOJ254TVzwpYAb-Ew8X-6-ZL3ZurlTiAwy19w/pub?output=csv';
const ORGANIC_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR6N1u2xV-Of_muP_LJY9OGC77qXDOJ254TVzwpYAb-Ew8X-6-ZL3ZurlTiAwy19w/pub?gid=512156750&single=true&output=csv';
const COMMUNITY_LINK = "https://chat.whatsapp.com/DVQrZLpHFR31KUgmPq6ibL";

// --- UTILS ---
const getDriveDirectLink = (url: string) => { 
  if (!url) return '';
  let trimmed = url.replace(/["']/g, "").trim();
  if (trimmed.includes(',')) {
    trimmed = trimmed.split(',')[0].trim();
  }
  if (trimmed.includes('drive.google.com')) { 
    const idMatch = trimmed.match(/[-\w]{25,}/); 
    if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w1000`; 
  } 
  return trimmed; 
};

const TrafficIcon: React.FC<{ source: string }> = ({ source }) => { 
    const normalized = source.toLowerCase().trim(); 
    if (normalized.includes('facebook')) return <Facebook size={12} className="text-blue-500" />; 
    if (normalized.includes('youtube') || normalized.includes('google')) return <Youtube size={12} className="text-red-500" />; 
    if (normalized.includes('tiktok')) return <Smartphone size={12} className="text-pink-500" />; 
    return <Target size={12} className="text-[#D4AF37]" />; 
};

const getTrafficBadgeStyle = (source: string) => {
  const normalized = source.toLowerCase().trim();
  if (normalized.includes('facebook')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (normalized.includes('youtube') || normalized.includes('google')) return 'bg-red-500/10 text-red-400 border-red-500/20';
  if (normalized.includes('tiktok')) return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
  return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
};

const getFastDownloadUrl = (url: string) => {
  if (!url) return '';
  const trimmed = url.replace(/["']/g, "").trim(); 
  if (trimmed.includes('bunny.net') || trimmed.includes('b-cdn.net')) {
    if (trimmed.includes('playlist.m3u8')) return trimmed.replace('playlist.m3u8', 'play_480p.mp4');
    if (trimmed.endsWith('original')) return trimmed.replace('original', 'play_480p.mp4');
  }
  return trimmed;
};

const VideoPlayerMini: React.FC<{ url: string }> = ({ url }) => {
  const trimmed = url ? url.trim() : '';
  if (!trimmed) return <div className="w-full h-full bg-[#050505] flex items-center justify-center text-zinc-600 text-[10px] uppercase font-semibold">Sem Mídia</div>;
  
  if (trimmed.match(/\.(jpeg|jpg|gif|png|webp)$/i) || trimmed.includes('drive.google.com/thumbnail') || trimmed.includes('drive.google.com/file')) {
    return <img src={getDriveDirectLink(trimmed) || trimmed} alt="Preview" loading="lazy" className="w-full h-full object-contain bg-black" />;
  } else if (trimmed.includes('bunny.net') || trimmed.includes('b-cdn.net')) {
    let baseUrl = trimmed.replace(/playlist\.m3u8|play_720p\.mp4|play_480p\.mp4|play_360p\.mp4|original/, '');
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    return (
      <video className="w-full h-full object-contain bg-black" controls playsInline controlsList="nodownload">
        <source src={`${baseUrl}play_480p.mp4`} type="video/mp4" />
        <source src={`${baseUrl}play_360p.mp4`} type="video/mp4" />
      </video>
    );
  } else if (trimmed.includes('.mp4') || trimmed.includes('.m3u8') || trimmed.includes('bunny.net') || trimmed.includes('b-cdn.net')) {
    return <video className="w-full h-full object-contain bg-black" controls playsInline><source src={trimmed} type="video/mp4" /></video>;
  } else {
    const embedUrl = trimmed.includes('vimeo.com') ? `https://player.vimeo.com/video/${trimmed.match(/(?:vimeo\.com\/|video\/)([0-9]+)/)?.[1]}` : (trimmed.includes('youtube.com') ? `https://www.youtube.com/embed/${trimmed.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]}` : trimmed);
    return <iframe className="w-full h-full" src={embedUrl} frameBorder="0" allowFullScreen></iframe>;
  }
};


const parseCSV = (csvText: string): string[][] => {
  const lines: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(current.trim());
      lines.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (row.length > 0 || current !== '') {
    row.push(current.trim());
    lines.push(row);
  }
  return lines;
};

const convertSocialToEmbed = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  // YouTube Shorts
  if (trimmed.includes('youtube.com/shorts/') || trimmed.includes('youtu.be/shorts/')) {
    const match = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  // Instagram Reels
  if (trimmed.includes('instagram.com/')) {
    const match = trimmed.match(/\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.instagram.com/reel/${match[1]}/embed/`;
    }
  }

  // TikTok
  if (trimmed.includes('tiktok.com/')) {
    const match = trimmed.match(/\/video\/(\d+)/);
    if (match && match[1]) {
      return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
  }

  return trimmed;
};

const getEngagementLevel = (views: string) => {
  if (!views) return '🔥 ALTA';
  const clean = views.toLowerCase().trim();
  if (clean.includes('m') || (parseFloat(clean) >= 1000000)) {
    return '🔥 CRÍTICO';
  }
  if (clean.includes('k') || parseFloat(clean) >= 100000) {
    return '📈 EM ALTA';
  }
  return '🟢 ESTÁVEL';
};





// --- NOVO CARD MINIMALISTA (TAGS) ---
const OfferCard = ({ offer, onClick, isFavorite, onFavoriteToggle }: { offer: any; onClick?: () => void; isFavorite?: boolean; onFavoriteToggle?: (e: React.MouseEvent) => void }) => {
    return (
        <div onClick={onClick} className="bg-[#0a0a0a] border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col h-full relative cursor-pointer rounded-lg overflow-hidden group font-sans antialiased">
            <div className="relative aspect-video overflow-hidden shrink-0 bg-[#050505]">
                <img src={getDriveDirectLink(offer.coverImage) || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800'} alt={offer.title} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    <button 
                        className={`p-1.5 rounded border backdrop-blur-md transition-all ${isFavorite ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-black/60 hover:bg-[#D4AF37] hover:text-black text-white border-white/10'}`} 
                        onClick={(e) => { e.stopPropagation(); onFavoriteToggle?.(e); }}
                        title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                    >
                        <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button className="p-1.5 bg-black/60 hover:bg-[#D4AF37] hover:text-black text-white rounded border border-white/10 backdrop-blur-md transition-colors" onClick={(e) => { e.stopPropagation(); }}><FolderOpen size={14} /></button>
                </div>
            </div>
            
            <div className="p-3 flex flex-col flex-1">
                {/* Sistema de Tags Limpo e Alinhado Horizontalmente */}
                <div className="flex flex-row flex-nowrap items-center gap-1 mb-3 overflow-hidden w-full">
                    {(offer.trafficSource || []).slice(0, 1).map((s: string, idx: number) => (
                        <span key={idx} className={`inline-flex items-center gap-1 text-[8px] uppercase font-semibold tracking-normal px-1.5 py-0.5 rounded-full border shrink-0 max-w-[65px] whitespace-nowrap overflow-hidden ${getTrafficBadgeStyle(s)}`} title={s}>
                            <span className="shrink-0"><TrafficIcon source={s} /></span>
                            <span className="truncate">{s}</span>
                        </span>
                    ))}
                    {offer.niche && (
                        <span className="inline-flex items-center text-[8px] uppercase font-semibold tracking-normal bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full shrink-0 max-w-[65px] whitespace-nowrap overflow-hidden" title={offer.niche}>
                            <span className="truncate">{offer.niche}</span>
                        </span>
                    )}
                    {offer.productType && (
                        <span className="inline-flex items-center text-[8px] uppercase font-semibold tracking-normal bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full shrink-0 max-w-[65px] whitespace-nowrap overflow-hidden" title={offer.productType}>
                            <span className="truncate">{offer.productType}</span>
                        </span>
                    )}
                    {offer.language && (
                        <span className="inline-flex items-center text-[8px] uppercase font-semibold tracking-normal bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0 max-w-[45px] whitespace-nowrap overflow-hidden" title={offer.language}>
                            <span className="truncate">{offer.language}</span>
                        </span>
                    )}
                </div>
                
                <h3 className="font-semibold text-zinc-200 mb-1 line-clamp-2 text-xs uppercase tracking-normal break-all overflow-hidden mt-auto font-sans antialiased" title={offer.title}>
                    {offer.title}
                </h3>
            </div>
        </div>
    );
};

// Removed Laboratory AI dashboards

export type PlatformType = 'TikTok' | 'Reels' | 'Shorts';

export interface OrganicHook {
  id: string;
  plataforma: PlatformType;
  nicho: string;
  linkVideo: string;
  visualizacoes: string;
  gancho: string;
}



// --- APP PRINCIPAL ---
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('swiper_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [currentModule, setCurrentModule] = useState('home');
  const [currentPage, setCurrentPage] = useState<string>('dashboard'); 
  const [offers, setOffers] = useState<any[]>([]);

  // Unused States and useEffect removed

  // Filtros e Sub-menus
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNiche, setFilterNiche] = useState('Todos');
  const [filterType, setFilterType] = useState('Todos');
  const [filterPlatform, setFilterPlatform] = useState('Todos');
  const [filterLanguage, setFilterLanguage] = useState('Todos');
  const [activeSubTab, setActiveSubTab] = useState('OFERTAS'); // OFERTAS, CRIATIVOS, VSL's, PÁGINAS
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);

  // States do Módulo de Virais Orgânicos
  const [activeViralTab, setActiveViralTab] = useState('TIKTOK');
  const [viralNiche, setViralNiche] = useState('Todos');
  const [organicVideos, setOrganicVideos] = useState<any[]>([]);

  // Favorites State with persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('swiper_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('swiper_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleFavoriteToggle = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  // Sync selectedOffer with browser history for native back button support
  useEffect(() => {
    if (selectedOffer) {
      if (window.location.hash !== '#offer') {
        window.history.pushState({}, '', '#offer');
      }
    } else {
      if (window.location.hash === '#offer') {
        window.history.back();
      }
    }
  }, [selectedOffer]);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.hash !== '#offer') {
        setSelectedOffer(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);




  // Estados do Radar de Ganchos
  const [hookFilterPlatform, setHookFilterPlatform] = useState<string>('Todos');
  const [hookFilterType, setHookFilterType] = useState<string>('Todos');
  const [organicHooks, setOrganicHooks] = useState<OrganicHook[]>([]);
  const [isHooksLoading, setIsHooksLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(CSV_URL);
        const text = await res.text();
        
        const rows = parseCSV(text);
        
        const data = rows.slice(2).map((v, i) => {
            if (!v[1] || v[1].trim() === '') return null;
            const statusVal = (v[19] || '').trim().toUpperCase();
            if (statusVal !== 'ATIVO') return null; // Strictly active status rows only
            
            return {
                id: v[0] || String(i),
                title: v[1] || '',
                niche: v[2] || '',
                productType: v[3] || 'Geral',
                description: v[4] || '',
                coverImage: v[5] || '',
                trend: v[6] || '',
                views: v[7] || '',
                vslEmbedUrl: v[8] || '',
                vslDownloadUrl: v[9] || '',
                transcriptionUrl: v[10] || '',
                creativeEmbedUrls: v[11] || '',
                creativeDownloadUrls: v[12] || '',
                facebookUrl: v[13] || '',
                pageUrl: v[14] || '',
                language: v[15] || 'PT-BR',
                trafficSource: (v[16] || 'facebook').split(',').map((s: string) => s.trim()),
                creativeZipUrl: v[17] || '',
                status: statusVal,
                vslLinks: v[8] ? v[8].split(',').map((url: string) => ({ url: url.trim() })) : []
            };
        }).filter(o => o !== null) as any[];
        
        // Reverse sort so latest entries appear first
        setOffers(data.reverse());

      } catch (e) { console.error(e); }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    const fetchOrganicVideos = async () => {
      try {
        const res = await fetch(ORGANIC_CSV_URL);
        const text = await res.text();
        const rows = parseCSV(text);
        
        const data = rows.slice(1).map((v, i) => {
          if (!v[1] || v[1].trim() === '') return null;
          const statusVal = (v[0] || '').trim().toUpperCase();
          if (statusVal !== 'ATIVO') return null;
          
          return {
            id: v[3] || String(i),
            status: statusVal,
            platform: (v[1] || '').trim().toUpperCase(),
            niche: v[2] || '',
            linkVideo: v[3] || '',
            embedUrl: convertSocialToEmbed(v[3] || ''),
            views: v[4] || '',
            hook: v[5] || '',
            engagement: getEngagementLevel(v[4] || '')
          };
        }).filter(v => v !== null) as any[];
        
        setOrganicVideos(data.reverse());
      } catch (e) {
        console.error(e);
      }
    };
    fetchOrganicVideos();
  }, []);

  useEffect(() => {
    const fetchOrganicHooks = async () => {
      setIsHooksLoading(true);
      try {
        const hooksRef = collection(db, 'organic_hooks');
        const querySnapshot = await getDocs(hooksRef);
        const list: OrganicHook[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            plataforma: (data.plataforma || data.platform || 'TikTok') as PlatformType,
            nicho: data.nicho || data.niche || '',
            linkVideo: data.linkVideo || data.videoUrl || data.url || '',
            visualizacoes: data.visualizacoes || data.views || '',
            gancho: data.gancho || data.hook || ''
          });
        });
        setOrganicHooks(list);
      } catch (error) {
        console.error("Erro ao buscar organic_hooks do Firestore:", error);
      } finally {
        setIsHooksLoading(false);
      }
    };

    fetchOrganicHooks();
  }, []);

  // Reset filters and selected offer when switching pages or modules
  useEffect(() => {
    setSelectedOffer(null);
    setSearchQuery('');
    setFilterNiche('Todos');
    setFilterType('Todos');
    setFilterPlatform('Todos');
    setFilterLanguage('Todos');
    setActiveSubTab('OFERTAS');
    setActiveViralTab('TIKTOK');
    setViralNiche('Todos');
    setHookFilterPlatform('Todos');
    setHookFilterType('Todos');
  }, [currentPage, currentModule]);







  const renderContent = () => {
    // Admin Dashboard Route Protection
    if (currentPage === 'admin_dashboard' || currentModule === 'admin') {
      if (!isAuthenticated) {
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center border border-white/5 rounded-xl bg-[#0a0a0a]">
            <ShieldCheck size={48} className="text-[#D4AF37] mb-6 opacity-50" />
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Acesso Restrito</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold max-w-md">Você precisa estar autenticado para acessar este painel.</p>
          </div>
        );
      }
      return (
        <AdminDashboard 
          onBack={() => {
            setCurrentPage('dashboard');
            setCurrentModule('home');
          }} 
        />
      );
    }

    if (currentModule === 'swiper') {

        if (currentPage === 'cofre' || currentPage === 'favoritos') {
            if (selectedOffer) {
                return (
                    <div className="animate-in fade-in pb-20 font-sans antialiased">
                        <OfferDetails 
                            offer={selectedOffer} 
                            onBack={() => setSelectedOffer(null)} 
                            isFavorite={favorites.includes(selectedOffer.id)}
                            onFavoriteToggle={() => handleFavoriteToggle(selectedOffer.id)}
                        />
                    </div>
                );
            }

            // Extrair valores únicos normalizados para os dropdowns
            const uniqueNiches = ['Todos', ...Array.from(new Set(offers.map(o => o.niche?.trim().toUpperCase()).filter(Boolean)))];
            const uniqueTypes = ['Todos', ...Array.from(new Set(offers.map(o => o.productType?.trim().toUpperCase()).filter(Boolean)))];
            const uniquePlatforms = ['Todos', ...Array.from(new Set(offers.flatMap(o => o.trafficSource || []).map(s => s.trim().toUpperCase()).filter(Boolean)))];
            const uniqueLanguages = ['Todos', ...Array.from(new Set(offers.map(o => o.language?.trim().toUpperCase()).filter(Boolean)))];

            // Lógica de Filtro Multi-Nível + Sub-Tabs Funcionais
            const filteredOffers = offers.filter(o => {
                // If we are on favorites page, strictly show favorited items only
                if (currentPage === 'favoritos' && !favorites.includes(o.id)) {
                    return false;
                }

                // 1. Text Search (title or niche or description or productType or platform)
                const search = searchQuery.toLowerCase().trim();
                const matchSearch = !search || 
                    (o.title || '').toLowerCase().includes(search) || 
                    (o.niche || '').toLowerCase().includes(search) ||
                    (o.description || '').toLowerCase().includes(search) ||
                    (o.productType || '').toLowerCase().includes(search) ||
                    (o.trafficSource || []).some((s: string) => s.toLowerCase().includes(search));

                // 2. Dropdown Filters
                const matchNiche = filterNiche === 'Todos' || (o.niche || '').toUpperCase() === filterNiche.toUpperCase();
                const matchType = filterType === 'Todos' || (o.productType || '').toUpperCase() === filterType.toUpperCase();
                const matchPlatform = filterPlatform === 'Todos' || (o.trafficSource || []).some((s: string) => s.toUpperCase() === filterPlatform.toUpperCase());
                const matchLanguage = filterLanguage === 'Todos' || (o.language || '').toUpperCase() === filterLanguage.toUpperCase();

                // 3. Functional Sub-Tabs Filter
                let matchSubTab = true;
                if (activeSubTab === 'CRIATIVOS') {
                    matchSubTab = (o.creativeEmbedUrls && o.creativeEmbedUrls.includes('http')) || 
                                  (o.creativeDownloadUrls && o.creativeDownloadUrls.includes('http')) ||
                                  (o.creativeZipUrl && o.creativeZipUrl.includes('http'));
                } else if (activeSubTab === "VSL's") {
                    matchSubTab = (o.vslEmbedUrl && o.vslEmbedUrl.includes('http')) || 
                                  (o.vslDownloadUrl && o.vslDownloadUrl.includes('http'));
                } else if (activeSubTab === 'PÁGINAS') {
                    matchSubTab = o.pageUrl && o.pageUrl.includes('http');
                }

                return matchSearch && matchNiche && matchType && matchPlatform && matchLanguage && matchSubTab;
            });

            return (
                <div className="animate-in fade-in pb-20 font-sans antialiased">
                    {/* CABEÇALHO, FILTROS E SUB-MENUS */}
                    <div className="flex flex-col mb-8 gap-5 bg-[#0a0a0a] p-5 rounded-xl border border-white/5 font-sans antialiased">
                        
                        <div className="flex flex-col gap-5 w-full">
                            {/* Titulo e Subtitulo */}
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-3 font-sans antialiased">
                                    <Briefcase className="text-[#D4AF37]" size={16} /> 
                                    {currentPage === 'favoritos' ? 'FAVORITOS SALVOS' : 'OFERTAS VALIDADAS'}
                                </h2>
                                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-semibold tracking-wider font-sans antialiased">Base de inteligência filtrada manualmente.</p>
                            </div>
                            
                            {/* Reorganized Controls: Unified Same horizontal row */}
                            <div className="flex flex-col lg:flex-row lg:items-end gap-3 w-full font-sans antialiased">
                                {/* Search Bar FIRST */}
                                <div className="flex flex-col gap-1 flex-1 lg:flex-[2]">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-sans antialiased">Buscar</span>
                                    <div className="relative w-full">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-pulse" />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar oferta..." 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                            className="w-full bg-[#050505] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-[#D4AF37]/50 font-normal placeholder:text-zinc-600 shadow-inner font-sans antialiased transition-all" 
                                        />
                                    </div>
                                </div>

                                {/* exactly 4 dropdown filters with small top labels */}
                                <div className="flex flex-col gap-1 shrink-0 lg:w-[15%]">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-sans antialiased">Nicho</span>
                                    <select 
                                        value={filterNiche} 
                                        onChange={(e) => setFilterNiche(e.target.value)}
                                        className="bg-[#050505] border border-white/10 rounded-lg py-2 px-3 text-xs text-zinc-300 outline-none focus:border-[#D4AF37]/50 font-medium cursor-pointer w-full font-sans antialiased"
                                    >
                                        {uniqueNiches.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1 shrink-0 lg:w-[15%]">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-sans antialiased">Tipo</span>
                                    <select 
                                        value={filterType} 
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="bg-[#050505] border border-white/10 rounded-lg py-2 px-3 text-xs text-zinc-300 outline-none focus:border-[#D4AF37]/50 font-medium cursor-pointer w-full font-sans antialiased"
                                    >
                                        {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1 shrink-0 lg:w-[15%]">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-sans antialiased">Plataforma</span>
                                    <select 
                                        value={filterPlatform} 
                                        onChange={(e) => setFilterPlatform(e.target.value)}
                                        className="bg-[#050505] border border-white/10 rounded-lg py-2 px-3 text-xs text-zinc-300 outline-none focus:border-[#D4AF37]/50 font-medium cursor-pointer w-full font-sans antialiased"
                                    >
                                        {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1 shrink-0 lg:w-[15%]">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-sans antialiased">Idioma</span>
                                    <select 
                                        value={filterLanguage} 
                                        onChange={(e) => setFilterLanguage(e.target.value)}
                                        className="bg-[#050505] border border-white/10 rounded-lg py-2 px-3 text-xs text-zinc-300 outline-none focus:border-[#D4AF37]/50 font-medium cursor-pointer w-full font-sans antialiased"
                                    >
                                        {uniqueLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SUB-MENU DE ABAS */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5 overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'OFERTAS', label: 'OFERTAS' },
                                { id: 'CRIATIVOS', label: 'CRIATIVOS' },
                                { id: "VSL's", label: "VSL's" },
                                { id: 'PÁGINAS', label: 'PÁGINAS' }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveSubTab(tab.id)}
                                    className={`px-5 py-2 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap font-sans antialiased ${activeSubTab === tab.id ? 'bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* GRID DE RESULTADOS DEPENDENDO DA SUB-ABA ATIVA */}
                    {(() => {
                        if (filteredOffers.length === 0) {
                            return (
                                <div className="col-span-full py-10 text-center">
                                    <p className="text-zinc-500 text-xs uppercase font-semibold font-sans antialiased">
                                        Nenhuma oferta curada encontrada.
                                    </p>
                                </div>
                            );
                        }

                        if (activeSubTab === 'CRIATIVOS') {
                            const allCreatives = filteredOffers.flatMap(o => {
                                const embeds = o.creativeEmbedUrls ? o.creativeEmbedUrls.split(',').map((url: string) => url.trim()).filter(Boolean) : [];
                                const downloads = o.creativeDownloadUrls ? o.creativeDownloadUrls.split(',').map((url: string) => url.trim()).filter(Boolean) : [];
                                const maxLen = Math.max(embeds.length, downloads.length);
                                return Array.from({ length: maxLen }).map((_, idx) => ({
                                    offerId: o.id,
                                    offerTitle: o.title,
                                    embedUrl: embeds[idx] || '',
                                    downloadUrl: downloads[idx] || '',
                                    index: idx + 1
                                }));
                            });

                            if (allCreatives.length === 0) {
                                return (
                                    <div className="col-span-full py-10 text-center">
                                        <p className="text-zinc-500 text-xs uppercase font-semibold font-sans antialiased">
                                            Nenhum criativo ativo encontrado.
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 font-sans antialiased">
                                    {allCreatives.map((c, idx) => (
                                        <div key={idx} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col gap-3 font-sans antialiased group hover:border-[#D4AF37]/30 transition-all duration-300">
                                            <div className="rounded-lg overflow-hidden border border-white/5 bg-black aspect-video relative">
                                                <VideoPlayerMini url={c.embedUrl || c.downloadUrl} />
                                            </div>
                                            <div className="flex flex-col flex-1 gap-1">
                                                <span className="text-[9px] text-[#D4AF37] font-semibold uppercase tracking-wider">Criativo #{c.index}</span>
                                                <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1 uppercase tracking-tight">{c.offerTitle}</h4>
                                            </div>
                                            {c.downloadUrl && (
                                                <a 
                                                    href={getFastDownloadUrl(c.downloadUrl)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="w-full flex items-center justify-center gap-2 py-2 bg-[#D4AF37] text-black text-[10px] font-bold uppercase tracking-wider rounded hover:bg-white hover:scale-[1.02] transition-all font-sans antialiased"
                                                >
                                                    <Download size={12} /> BAIXAR CRIATIVO
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        }

                        if (activeSubTab === "VSL's") {
                            const offersWithVsl = filteredOffers.filter(o => (o.vslEmbedUrl && o.vslEmbedUrl.trim() !== '') || (o.vslDownloadUrl && o.vslDownloadUrl.trim() !== '') || (o.vslLinks && o.vslLinks.length > 0));

                            if (offersWithVsl.length === 0) {
                                return (
                                    <div className="col-span-full py-10 text-center">
                                        <p className="text-zinc-500 text-xs uppercase font-semibold font-sans antialiased">
                                            Nenhuma VSL encontrada.
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans antialiased">
                                    {offersWithVsl.map((o: any) => (
                                        <div key={o.id} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 flex flex-col gap-4 font-sans antialiased group hover:border-[#D4AF37]/30 transition-all duration-300">
                                            <div className="rounded-lg overflow-hidden border border-white/5 bg-black aspect-video relative">
                                                <VideoPlayerMini url={o.vslEmbedUrl || o.vslDownloadUrl} />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[9px] text-[#D4AF37] font-semibold uppercase tracking-wider">VSL Longa-Metragem</span>
                                                <h4 className="text-sm font-semibold text-zinc-200 uppercase tracking-tight line-clamp-1">{o.title}</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-auto font-sans antialiased">
                                                {o.vslDownloadUrl && (
                                                    <a 
                                                        href={getFastDownloadUrl(o.vslDownloadUrl)} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="flex items-center justify-center gap-2 py-2.5 bg-[#D4AF37] text-black text-[10px] font-bold uppercase tracking-wider rounded hover:bg-white hover:scale-[1.02] transition-all font-sans antialiased"
                                                    >
                                                        <Download size={12} /> BAIXAR VSL
                                                    </a>
                                                )}
                                                {o.transcriptionUrl && (
                                                    <a 
                                                        href={o.transcriptionUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="flex items-center justify-center gap-2 py-2.5 bg-[#121212] text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded hover:text-white hover:bg-white/5 transition-all border border-white/5 font-sans antialiased"
                                                    >
                                                        <FileText size={12} /> VER SCRIPT
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        }

                        if (activeSubTab === 'PÁGINAS') {
                            const offersWithPages = filteredOffers.filter(o => o.pageUrl && o.pageUrl.trim() !== '');

                            if (offersWithPages.length === 0) {
                                return (
                                    <div className="col-span-full py-10 text-center">
                                        <p className="text-zinc-500 text-xs uppercase font-semibold font-sans antialiased">
                                            Nenhuma landing page encontrada.
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans antialiased">
                                    {offersWithPages.map((o: any) => (
                                        <div key={o.id} className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden flex flex-col h-full font-sans antialiased group hover:border-[#D4AF37]/30 transition-all duration-300">
                                            <div className="relative aspect-video overflow-hidden shrink-0 bg-[#050505] border-b border-white/5">
                                                <img src={getDriveDirectLink(o.coverImage) || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800'} alt={o.title} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                            </div>
                                            <div className="p-4 flex flex-col flex-1 gap-4 font-sans antialiased">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] text-[#D4AF37] font-semibold uppercase tracking-wider">Landing Page</span>
                                                    <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-tight line-clamp-2">{o.title}</h4>
                                                </div>
                                                <a 
                                                    href={o.pageUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 bg-[#D4AF37] text-black text-[10px] font-bold uppercase tracking-wider rounded hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] font-sans antialiased"
                                                >
                                                    ACESSAR LINK EXTERNO <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        }

                        // OFERTAS: Renders standard product overview grid
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 font-sans antialiased">
                                {filteredOffers.map((o: any) => (
                                    <OfferCard 
                                        key={o.id} 
                                        offer={o} 
                                        onClick={() => setSelectedOffer(o)} 
                                        isFavorite={favorites.includes(o.id)}
                                        onFavoriteToggle={() => handleFavoriteToggle(o.id)}
                                    />
                                ))}
                            </div>
                        );
                    })()}
                </div>
            );
        }

        if (currentPage === 'biblioteca') {
            return (
                <div className="w-full h-full flex flex-col">
                    <AdLibrary />
                </div>
            );
        }

        // --- INTERCEPTADOR E EXTENSÃO CONTINUAM AQUI... (ocultos para poupar espaço visual, mas renderizam normalmente) ---
        if (currentPage === 'interceptador') {
            const hookTypes = ['Todos', ...Array.from(new Set(organicHooks.map(item => item.gancho).filter(Boolean)))];
            const platforms = ['Todos', 'TikTok', 'Reels', 'Shorts'];

            const filteredHooks = organicHooks.filter(item => {
                const matchPlatform = hookFilterPlatform === 'Todos' || item.plataforma === hookFilterPlatform;
                const matchType = hookFilterType === 'Todos' || item.gancho === hookFilterType;
                return matchPlatform && matchType;
            });

            return (
                <div className="animate-in fade-in pb-20 font-sans antialiased max-w-6xl mx-auto mt-6">
                    {/* Header and Filters */}
                    <div className="flex flex-col mb-8 gap-5 bg-[#0a0a0a] p-5 rounded-xl border border-white/5 font-sans antialiased">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-3 font-sans antialiased">
                                    <Radar className="text-[#D4AF37]" size={16} /> 
                                    RADAR DE GANCHOS
                                </h2>
                                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-semibold tracking-wider font-sans antialiased">
                                    Monitore os ganchos e as visualizações dos vídeos orgânicos mais virais do momento.
                                </p>
                            </div>
                            
                            {/* Filter Controls Row */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex flex-col gap-1 min-w-[150px]">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-sans antialiased">Plataforma</span>
                                    <select 
                                        value={hookFilterPlatform} 
                                        onChange={(e) => setHookFilterPlatform(e.target.value)}
                                        className="bg-[#050505] border border-white/10 rounded-lg py-2 px-3 text-xs text-zinc-300 outline-none focus:border-[#D4AF37]/50 font-medium cursor-pointer w-full font-sans antialiased"
                                    >
                                        {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1 min-w-[180px]">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-sans antialiased">Tipo de Gancho</span>
                                    <select 
                                        value={hookFilterType} 
                                        onChange={(e) => setHookFilterType(e.target.value)}
                                        className="bg-[#050505] border border-white/10 rounded-lg py-2 px-3 text-xs text-zinc-300 outline-none focus:border-[#D4AF37]/50 font-medium cursor-pointer w-full font-sans antialiased"
                                    >
                                        {hookTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid de Cards */}
                    {isHooksLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center border border-white/5 rounded-xl bg-[#0a0a0a]/50 space-y-4">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20 animate-ping"></div>
                                <Radar size={24} className="text-[#D4AF37] animate-spin" />
                            </div>
                            <div className="space-y-1 font-mono text-xs text-emerald-400">
                                <p className="animate-pulse">_ INTERCEPTANDO TRANSMISSÕES DE GANCHOS ORGÂNICOS...</p>
                            </div>
                        </div>
                    ) : filteredHooks.length === 0 ? (
                        <div className="py-20 text-center border border-white/5 rounded-xl bg-[#0a0a0a]/50">
                            <p className="text-zinc-500 text-xs uppercase font-semibold tracking-wider font-sans">
                                Nenhum gancho encontrado com os filtros selecionados.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredHooks.map(hook => {
                                // Platform icon mapping
                                let PlatformIcon = Smartphone;
                                if (hook.plataforma === 'Reels') PlatformIcon = Video;
                                if (hook.plataforma === 'Shorts') PlatformIcon = Youtube;

                                // Neon tag style for hook types
                                let neonTagStyle = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]';
                                if (hook.gancho.includes('ANTES')) {
                                    neonTagStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.15)]';
                                } else if (hook.gancho.includes('CURIOSIDADE')) {
                                    neonTagStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]';
                                } else if (hook.gancho.includes('PROBLEMA')) {
                                    neonTagStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)]';
                                }

                                return (
                                    <div 
                                        key={hook.id} 
                                        className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between aspect-[9/16] hover:border-[#D4AF37]/30 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] group relative overflow-hidden"
                                    >
                                        {/* Background Subtle Tech Line */}
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent"></div>
                                        
                                        {/* Top Header Row of the Card */}
                                        <div className="flex items-center justify-between z-10">
                                            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 py-1 px-2.5 rounded-full">
                                                <PlatformIcon size={12} className="text-zinc-400" />
                                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{hook.plataforma}</span>
                                            </div>
                                            <span className="text-[8px] font-black tracking-widest bg-white/5 border border-white/10 text-zinc-400 py-1 px-2.5 rounded-full uppercase">
                                                {hook.nicho}
                                            </span>
                                        </div>

                                        {/* Video mockup frame area */}
                                        <div className="flex-1 my-4 bg-zinc-950/80 border border-white/5 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-4">
                                            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                            
                                            {/* Visual views metric in center */}
                                            <div className="flex flex-col items-center justify-center gap-2 z-10 text-center">
                                                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-lg group-hover:border-[#D4AF37]/30 transition-colors duration-300">
                                                    <Flame size={24} className="text-[#D4AF37] animate-pulse" />
                                                </div>
                                                <div className="mt-2">
                                                    <span className="text-2xl font-black text-white tracking-tighter font-mono">{hook.visualizacoes}</span>
                                                    <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Visualizações</p>
                                                </div>
                                            </div>
                                            
                                            {/* Glow scanner line */}
                                            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent top-0 animate-[skeleton-scan_3s_ease-in-out_infinite]"></div>
                                        </div>

                                        {/* Bottom Tag & Action buttons */}
                                        <div className="space-y-3 z-10">
                                            {/* Hook Type Tag */}
                                            <div className={`w-full py-2 px-3 text-center rounded-lg border font-black text-[10px] uppercase tracking-widest ${neonTagStyle}`}>
                                                GANCHO: {hook.gancho}
                                            </div>

                                            {/* Action button */}
                                            <a 
                                                href={hook.linkVideo} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full bg-zinc-900 border border-white/10 hover:bg-white hover:text-black text-white hover:border-white font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[9px] active:scale-[0.98] cursor-pointer"
                                            >
                                                <ExternalLink size={10} />
                                                Acessar Transmissão
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        if (currentPage === 'extensao') {
            return (
                <div className="animate-in fade-in max-w-5xl mx-auto mt-6 font-sans antialiased">
                    <div className="mb-8 border-b border-white/5 pb-6">
                        <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 mb-2 font-sans antialiased">
                            <Puzzle className="text-[#D4AF37]" size={22} /> CENTRAL DE EXTENSÃO 007
                        </h2>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-sans antialiased">
                            Módulo avançado de captura e mineração de ofertas estruturadas.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Left Side (65% width) */}
                        <div className="w-full lg:w-[65%] space-y-4">
                            <div className="aspect-video bg-[#050505] border border-white/5 rounded-xl overflow-hidden shadow-2xl relative">
                                <iframe 
                                    className="w-full h-full"
                                    src="https://www.youtube.com/embed/En_eE15WR3s"
                                    title="Installation Tutorial"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-normal leading-relaxed font-sans antialiased">
                                Aprenda como instalar a extensão no modo desenvolvedor e utilizar as funções de mineração de vídeo e desbloqueio de downloads em sites protegidos.
                            </p>
                        </div>

                        {/* Right Side (35% width) */}
                        <div className="w-full lg:w-[35%]">
                            <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden group hover:border-[#D4AF37]/25 transition-all duration-300">
                                {/* Background Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/2 rounded-full blur-2xl pointer-events-none"></div>
                                
                                <div className="p-4 bg-[#121212] rounded-full border border-white/5 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300">
                                    <Puzzle size={36} />
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest font-sans antialiased">007 SWIPER SPY</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-sans antialiased">VERSÃO V23.0 (ESTÁVEL)</p>
                                </div>

                                <a 
                                    href="https://drive.google.com/file/d/1s0Jnth9iCVuwPyU1nMo7vssjPO7UtcZN/view?usp=drive_link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-widest py-3.5 px-6 rounded-lg text-[11px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(212,175,55,0.15)] active:scale-[0.98] font-sans antialiased"
                                >
                                    📥 BAIXAR .ZIP
                                </a>

                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wide leading-relaxed font-sans antialiased max-w-[250px]">
                                    COMPATÍVEL COM GOOGLE CHROME, EDGE E BRAVE. INSTALAÇÃO MANUAL NECESSÁRIA.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    if (currentModule === 'organicos' || currentPage === 'virais') {
        const uniqueViralNiches = ['Todos', ...Array.from(new Set(organicVideos.map(v => v.niche).filter(Boolean)))];

        const filteredVideos = organicVideos.filter(v => {
            const matchTab = v.platform === activeViralTab;
            const matchNiche = viralNiche === 'Todos' || v.niche === viralNiche;
            return matchTab && matchNiche;
        });

        return (
            <div className="animate-in fade-in max-w-6xl mx-auto mt-6 font-sans antialiased">
                <div className="mb-8">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 mb-2 font-sans antialiased">
                        <Smartphone className="text-[#D4AF37]" size={22} /> CENTRAL DE VIRAIS ORGÂNICOS
                    </h2>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-sans antialiased">
                        Tendências e criativos que estão estourando no tráfego orgânico.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-[#0a0a0a] p-5 rounded-xl border border-white/5 font-sans antialiased">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                        {[
                            { id: 'TIKTOK', label: 'TikTok Trends', icon: Smartphone },
                            { id: 'REELS', label: 'Instagram Reels', icon: Video },
                            { id: 'SHORTS', label: 'YouTube Shorts', icon: Youtube }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveViralTab && setActiveViralTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                    activeViralTab === tab.id
                                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30'
                                        : 'text-zinc-400 border-transparent hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <tab.icon size={14} />
                                <span className="text-xs uppercase font-semibold tracking-wider">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-sans antialiased">Nicho</span>
                        <select 
                            value={viralNiche} 
                            onChange={(e) => setViralNiche(e.target.value)}
                            className="bg-[#050505] border border-white/10 rounded-lg py-2 px-3 text-xs text-zinc-300 outline-none focus:border-[#D4AF37]/50 font-medium cursor-pointer min-w-[150px] font-sans antialiased"
                        >
                            {uniqueViralNiches.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                {filteredVideos.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-zinc-500 text-xs uppercase font-semibold font-sans antialiased">
                            Nenhuma tendência viral encontrada para este filtro.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans antialiased">
                        {filteredVideos.map(v => {
                            const videoTitle = `Viral de ${v.niche || 'Geral'}`;
                            
                            // Helper function to strip query parameters from the URL
                            const getCleanUrl = (url: string): string => {
                                return url.split('?')[0];
                            };
                            const cleanUrl = v.embedUrl ? getCleanUrl(v.embedUrl) : '';

                            return (
                                <div key={v.id} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col gap-4 font-sans antialiased group hover:border-[#D4AF37]/30 transition-all duration-300">
                                    <div className="w-full aspect-[9/16] bg-zinc-900 border border-white/10 rounded-lg relative overflow-hidden group shadow-inner">
                                        {cleanUrl ? (
                                            <iframe 
                                                src={cleanUrl}
                                                title={videoTitle}
                                                className="w-full h-full rounded-lg"
                                                frameBorder="0"
                                                allowFullScreen
                                                scrolling="no"
                                            ></iframe>
                                        ) : (
                                            <div className="w-full h-full bg-[#050505] flex items-center justify-center text-zinc-600 text-[10px] uppercase font-semibold">Sem Mídia</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1 gap-3">
                                        <div>
                                            <span className="inline-block text-[8px] uppercase font-semibold tracking-normal bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-2 py-0.5 rounded-full mb-1">
                                                {v.niche}
                                            </span>
                                            <h4 className="text-xs font-semibold text-zinc-200 line-clamp-2 uppercase tracking-tight leading-relaxed">{videoTitle}</h4>
                                        </div>
                                        
                                        <div className="space-y-1.5 border-t border-white/5 pt-2 text-[10px]">
                                            <div className="flex items-center justify-between">
                                                <span className="text-zinc-500 uppercase font-semibold">🔥 Engajamento</span>
                                                <span className="text-emerald-400 font-bold">{v.engagement}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-zinc-500 uppercase font-semibold">📊 Visualizações Estimadas</span>
                                                <span className="text-zinc-200 font-bold font-mono">{v.views}</span>
                                            </div>
                                        </div>

                                        <div className="bg-[#050505] border border-white/5 p-2.5 rounded text-[9px] text-zinc-400 leading-relaxed mt-auto">
                                            <span className="font-bold text-[#D4AF37] uppercase block mb-0.5">Gancho / Hook:</span>
                                            {v.hook}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Deleted routes

    if (currentModule === 'home' || currentPage === 'dashboard') {
        const baseOffers = offers.length > 0 ? offers.slice(0, 10) : [
            { id: '1', title: 'PROTOCOLO ZERO BARRIGA', niche: 'Saúde', coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300', trend: 'ROI: 400%' },
            { id: '2', title: 'VELAS AROMÁTICAS LUCRATIVAS', niche: 'Hobbies', coverImage: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=300', trend: 'ROI: 350%' },
            { id: '3', title: 'CÓDIGO DA RIQUEZA', niche: 'Finanças', coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=300', trend: 'ROI: 520%' },
            { id: '4', title: 'MANUAL DA CONQUISTA', niche: 'Relacionamento', coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300', trend: 'ROI: 310%' },
            { id: '5', title: 'DESPERTAR HORMONAL', niche: 'Saúde', coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=300', trend: 'ROI: 450%' },
            { id: '6', title: 'CERVEJA ARTESANAL', niche: 'Gastronomia', coverImage: 'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?q=80&w=300', trend: 'ROI: 380%' }
        ];

        let displayOffers = [...baseOffers];
        while (displayOffers.length < 8) {
            displayOffers = [...displayOffers, ...baseOffers];
        }

        return (
            <div className="animate-in fade-in duration-500 w-full font-sans antialiased pb-20 pt-2 px-8 md:px-12">
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes marquee-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                  .animate-marquee-infinite {
                    display: flex;
                    width: max-content;
                    animation: marquee-scroll 35s linear infinite;
                  }
                  .animate-marquee-infinite:hover {
                    animation-play-state: paused;
                  }
                  .mask-marquee-glow {
                    mask-image: linear-gradient(to right, transparent, white 8%, white 92%, transparent);
                    -webkit-mask-image: linear-gradient(to right, transparent, white 8%, white 92%, transparent);
                  }
                ` }} />

                {/* Header/Persuasive Copy */}
                <div className="text-center space-y-3 py-4 border-b border-white/5 mb-8 md:mb-12">
                    <h1 className="text-xl md:text-3xl font-black tracking-wider text-white">
                        O ECOSSISTEMA DEFINITIVO PARA <span className="text-[#D4AF37]">DOMINAR O MERCADO</span>.
                    </h1>
                    <p className="text-zinc-400 text-[10px] md:text-xs uppercase tracking-widest font-semibold max-w-2xl mx-auto">
                        Copie o que funciona, escale o que converte. Nenhuma oferta passa despercebida.
                    </p>
                </div>

                <div className="w-full space-y-8">
                    
                    {/* Dynamic Marquee Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
                            🔥 RADAR DE OFERTAS (EM ALTA)
                        </h3>
                        
                        <div className="relative w-full overflow-hidden py-1 mask-marquee-glow rounded-xl border border-white/5 bg-[#070707] p-2">
                            <div className="animate-marquee-infinite gap-4">
                                {displayOffers.concat(displayOffers).map((offer, idx) => {
                                    const imgUrl = getDriveDirectLink(offer.coverImage) || offer.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300';
                                    const isFav = favorites.includes(offer.id);
                                    return (
                                        <div 
                                            key={idx} 
                                            onClick={() => {
                                                setSelectedOffer(offer);
                                                setCurrentModule('swiper');
                                                setCurrentPage('cofre');
                                            }}
                                            className="flex-shrink-0 w-72 bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden group hover:border-[#D4AF37]/35 hover:scale-[1.02] transition-all duration-300 relative cursor-pointer"
                                        >
                                            <div className="h-40 overflow-hidden relative bg-black">
                                                <img 
                                                    src={imgUrl} 
                                                    alt={offer.title} 
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                                                />
                                                
                                                {/* Trend Badge */}
                                                <span className="absolute top-2 left-2 bg-black/80 border border-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                                    {offer.trend || 'ALTA CONVERSÃO'}
                                                </span>

                                                {/* Favorite Toggle Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFavoriteToggle(offer.id);
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 border border-white/10 hover:border-[#D4AF37]/50 text-zinc-400 hover:text-[#D4AF37] transition-all"
                                                >
                                                    <Star size={14} className={isFav ? "fill-[#D4AF37] text-[#D4AF37]" : ""} />
                                                </button>
                                            </div>
                                            <div className="p-3 space-y-1">
                                                <h4 className="text-xs md:text-sm font-bold text-white uppercase tracking-tight line-clamp-1 group-hover:text-[#D4AF37] transition-all">
                                                    {offer.title}
                                                </h4>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                                    {offer.niche || 'Geral'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Exclusive Tools Grid */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">FERRAMENTAS EXCLUSIVAS</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* OFERTAS VALIDADAS */}
                            <button 
                                onClick={() => {
                                    setCurrentModule('swiper');
                                    setCurrentPage('cofre');
                                    setSelectedOffer(null);
                                }}
                                className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl text-left flex flex-col justify-between min-h-[170px] relative overflow-hidden group hover:border-[#D4AF37]/40 hover:bg-[#0c0c0c] transition-all duration-300 shadow-xl cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/2 rounded-bl-full pointer-events-none"></div>
                                <div className="p-3 bg-[#121212] rounded-xl border border-white/5 text-[#D4AF37] w-fit">
                                    <Briefcase size={20} />
                                </div>
                                <div className="mt-4 space-y-1.5">
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#D4AF37] transition-all">OFERTAS VALIDADAS</h4>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Base de Inteligência</p>
                                    <p className="text-[11px] text-zinc-400 leading-normal font-normal pt-1">
                                        Acesse ofertas validadas, scripts e infraestrutura de vendas dos concorrentes.
                                    </p>
                                </div>
                            </button>

                            {/* BIBLIOTECA FACEBOOK */}
                            <button 
                                onClick={() => {
                                    setCurrentModule('swiper');
                                    setCurrentPage('biblioteca');
                                    setSelectedOffer(null);
                                }}
                                className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl text-left flex flex-col justify-between min-h-[170px] relative overflow-hidden group hover:border-[#D4AF37]/40 hover:bg-[#0c0c0c] transition-all duration-300 shadow-xl cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/2 rounded-bl-full pointer-events-none"></div>
                                <div className="p-3 bg-[#121212] rounded-xl border border-white/5 text-[#D4AF37] w-fit">
                                    <Facebook size={20} />
                                </div>
                                <div className="mt-4 space-y-1.5">
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#D4AF37] transition-all">BIBLIOTECA FACEBOOK</h4>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Espionagem de Criativos</p>
                                    <p className="text-[11px] text-zinc-400 leading-normal font-normal pt-1">
                                        Explore nossa biblioteca interna de anúncios para obter insights imediatos.
                                    </p>
                                </div>
                            </button>

                            {/* RADAR DE GANCHOS */}
                            <button 
                                onClick={() => {
                                    setCurrentModule('swiper');
                                    setCurrentPage('interceptador');
                                    setSelectedOffer(null);
                                }}
                                className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl text-left flex flex-col justify-between min-h-[170px] relative overflow-hidden group hover:border-[#D4AF37]/40 hover:bg-[#0c0c0c] transition-all duration-300 shadow-xl cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/2 rounded-bl-full pointer-events-none"></div>
                                <div className="p-3 bg-[#121212] rounded-xl border border-white/5 text-[#D4AF37] w-fit">
                                    <Radar size={20} />
                                </div>
                                <div className="mt-4 space-y-1.5">
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#D4AF37] transition-all">RADAR DE GANCHOS</h4>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Espionagem Orgânica</p>
                                    <p className="text-[11px] text-zinc-400 leading-normal font-normal pt-1">
                                        Rastreie ganchos e visualizações dos vídeos orgânicos virais (TikTok, Reels, Shorts) mais quentes do mercado.
                                    </p>
                                </div>
                            </button>

                            {/* EXTENSÃO */}
                            <button 
                                onClick={() => {
                                    setCurrentModule('swiper');
                                    setCurrentPage('extensao');
                                    setSelectedOffer(null);
                                }}
                                className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl text-left flex flex-col justify-between min-h-[170px] relative overflow-hidden group hover:border-[#D4AF37]/40 hover:bg-[#0c0c0c] transition-all duration-300 shadow-xl cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/2 rounded-bl-full pointer-events-none"></div>
                                <div className="p-3 bg-[#121212] rounded-xl border border-white/5 text-[#D4AF37] w-fit">
                                    <Puzzle size={20} />
                                </div>
                                <div className="mt-4 space-y-1.5">
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#D4AF37] transition-all">EXTENSÃO</h4>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Central de Captura</p>
                                    <p className="text-[11px] text-zinc-400 leading-normal font-normal pt-1">
                                        Baixe a extensão oficial do 007 Swiper para minerar vídeos e desbloquear downloads.
                                    </p>
                                </div>
                            </button>

                            {/* VIRAIS ORGÂNICOS */}
                            <button 
                                onClick={() => {
                                    setCurrentModule('organicos');
                                    setCurrentPage('virais');
                                }}
                                className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl text-left flex flex-col justify-between min-h-[170px] relative overflow-hidden group hover:border-[#D4AF37]/40 hover:bg-[#0c0c0c] transition-all duration-300 shadow-xl cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/2 rounded-bl-full pointer-events-none"></div>
                                <div className="p-3 bg-[#121212] rounded-xl border border-white/5 text-[#D4AF37] w-fit">
                                    <Smartphone size={20} />
                                </div>
                                <div className="mt-4 space-y-1.5">
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#D4AF37] transition-all">VIRAIS ORGÂNICOS</h4>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Mapeamento de Tendências</p>
                                    <p className="text-[11px] text-zinc-400 leading-normal font-normal pt-1">
                                        Monitore os criativos e vídeos orgânicos que estão viralizando nas redes sociais.
                                    </p>
                                </div>
                            </button>

                        </div>
                    </div>

                </div>

            </div>
        );
    }

    if (currentPage === 'suporte' || currentModule === 'central') {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto font-sans antialiased pb-20">
                <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-3 font-sans">
                        <HelpCircle className="text-[#D4AF37]" size={16} /> 
                        CENTRAL 007
                    </h2>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase font-semibold tracking-wider font-sans">
                        PAINEL DO AGENTE E COMUNICAÇÃO OFICIAL
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#D4AF37]/20 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#D4AF37]/2 rounded-bl-full pointer-events-none"></div>
                        <div className="space-y-4">
                            <span className="text-[9px] text-[#D4AF37] font-black tracking-widest uppercase">IDENTIDADE OPERACIONAL</span>
                            <div className="space-y-3 font-mono text-[10px] pt-2">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <span className="text-zinc-500 uppercase font-bold">SENHA</span>
                                    <span className="text-zinc-200 font-bold">AGENTE-007</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 uppercase font-bold">SESSÃO</span>
                                    <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-2 py-0.5 rounded text-[8px] font-black uppercase">INDIVIDUAL / PRIVADA</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#D4AF37]/20 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#D4AF37]/2 rounded-bl-full pointer-events-none"></div>
                        <div className="space-y-4 w-full">
                            <span className="text-[9px] text-[#D4AF37] font-black tracking-widest uppercase">SUPORTE TÉCNICO</span>
                            <p className="text-[11px] text-zinc-300 font-mono pt-2">suporte@007swiper.com</p>
                        </div>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText('suporte@007swiper.com');
                                alert('E-mail copiado com sucesso!');
                            }}
                            className="mt-6 w-full bg-[#121212] hover:bg-white hover:text-black border border-white/5 text-zinc-300 text-[9px] font-black uppercase tracking-widest py-2.5 rounded transition-all"
                        >
                            COPIAR E-MAIL
                        </button>
                    </div>


                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center border border-white/5 rounded-xl bg-[#0a0a0a]">
            <Sparkles size={48} className="text-[#D4AF37] mb-6 opacity-50" />
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Módulo em Desenvolvimento</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold max-w-md">O ambiente [{currentModule.toUpperCase()}] está sendo codificado.</p>
        </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <LandingPage 
        onLogin={() => {
          setIsAuthenticated(true);
          localStorage.setItem('swiper_authenticated', 'true');
        }} 
        onRouteToAdmin={() => {
          setIsAuthenticated(true);
          localStorage.setItem('swiper_authenticated', 'true');
          setCurrentPage('admin_dashboard');
          setCurrentModule('admin');
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white overflow-hidden font-sans antialiased">

      <header className="h-[65px] bg-[#0a0a0a] border-b border-white/5 fixed top-0 left-0 w-full z-50 flex items-center px-6 shadow-xl">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-[#D4AF37] p-1.5 rounded-md"><ShieldCheck className="text-black" size={20} /></div>
          <span className="text-lg font-black tracking-widest text-white uppercase italic">007 <span className="text-[#D4AF37]">SWIPER</span></span>
        </div>
        <nav className="flex-1 flex items-center justify-start gap-2 md:gap-4 overflow-x-auto scrollbar-hide px-6">
          {[
            { id: 'home', icon: HomeIcon, label: 'HOME', page: 'dashboard', module: 'home' },
            { id: 'ofertas', icon: Briefcase, label: 'OFERTAS VALIDADAS', page: 'cofre', module: 'swiper' },
            { id: 'biblioteca', icon: Facebook, label: 'BIBLIOTECA FACEBOOK', page: 'biblioteca', module: 'swiper' },
            // { id: 'interceptador', icon: Radar, label: 'RADAR DE GANCHOS', page: 'interceptador', module: 'swiper' },
            { id: 'extensao', icon: Puzzle, label: 'EXTENSÃO', page: 'extensao', module: 'swiper' },
            { id: 'favoritos', icon: Star, label: 'FAVORITOS', page: 'favoritos', module: 'swiper' },
            { id: 'central', icon: HelpCircle, label: 'CENTRAL 007', page: 'suporte', module: 'central' },
            { id: 'comunidade', icon: MessageCircle, label: 'COMUNIDADE VIP', page: 'comunidade', module: 'comunidade' }
          ].map(item => {
            const isActive = currentPage === item.page;
            
            if (item.id === 'comunidade') {
              return (
                <button 
                  key={item.id} 
                  onClick={() => window.open(COMMUNITY_LINK, '_blank')} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border border-green-500 text-green-500 hover:bg-green-500/10 whitespace-nowrap"
                >
                  <item.icon size={15} className="text-green-500" /> 
                  <span className="text-xs uppercase tracking-wide font-medium">{item.label}</span>
                </button>
              );
            }

            if (item.id === 'central') {
              return (
                <button 
                  key={item.id} 
                  onClick={() => {
                    setCurrentModule(item.module);
                    setCurrentPage(item.page);
                  }} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border whitespace-nowrap ${
                    isActive 
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 font-semibold' 
                      : 'text-yellow-500 border-transparent hover:text-yellow-500 hover:bg-yellow-500/5'
                  }`}
                >
                  <item.icon size={15} className={isActive ? "fill-yellow-500 text-yellow-500" : "text-yellow-500"} /> 
                  <span className="text-xs uppercase tracking-wide font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <button 
                key={item.id} 
                onClick={() => {
                  setCurrentModule(item.module);
                  setCurrentPage(item.page);
                  if (item.module === 'swiper') {
                    setSelectedOffer(null);
                  }
                }} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border whitespace-nowrap ${
                  isActive 
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 font-semibold' 
                    : 'text-white font-medium drop-shadow-md hover:text-zinc-200 border-transparent hover:bg-white/5'
                }`}
              >
                <item.icon size={15} className={isActive ? 'text-[#D4AF37]' : 'text-zinc-400 group-hover:text-white'} /> 
                <span className="text-xs uppercase tracking-wide font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="flex items-center shrink-0 pl-4 gap-4">
          <TelemetryHUD />
          <button 
            onClick={() => {
              if (window.confirm('Deseja realmente sair?')) {
                setIsAuthenticated(false);
                localStorage.removeItem('swiper_authenticated');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all border border-transparent text-red-500 hover:bg-red-500/10 hover:text-red-400 whitespace-nowrap"
          >
            <LogOut size={14} /> 
            <span className="text-[10px] font-black uppercase tracking-widest">SAIR</span>
          </button>
        </div>
      </header>
      <div className="flex flex-1 mt-[65px] w-full">
        <main className={
          currentPage === 'biblioteca'
            ? `flex-1 h-[calc(100vh-65px)] overflow-hidden flex flex-col`
            : `flex-1 p-8 overflow-y-auto h-[calc(100vh-65px)] flex flex-col justify-between`
        }>
            <div className={currentPage === 'biblioteca' ? "flex-1 h-full overflow-hidden" : "flex-1"}>
              {renderContent()}
            </div>
            
            {currentPage !== 'biblioteca' && (
              <footer className="border-t border-white/5 py-8 text-center bg-[#030303]/50 mt-12 relative z-10">
                <div className="max-w-6xl mx-auto px-6">
                  <p 
                    className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest select-none"
                  >
                    © 2026 007 SWIPER INTELLIGENCE PLATFORM. TODOS OS DIREITOS RESERVADOS.
                  </p>
                  <div
                    onDoubleClick={() => {
                      setCurrentPage('admin_dashboard');
                      setCurrentModule('admin');
                    }}
                    className="w-[100px] h-[100px] mx-auto mt-2 relative z-50 cursor-default select-none"
                    style={{ opacity: 0 }}
                  />
                </div>
              </footer>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;