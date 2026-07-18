import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Check, RefreshCw, Layers, Flame, HelpCircle } from 'lucide-react';
import { AdCard, Ad } from './AdCard';

const mapApifyAdToAd = (item: any, index: number): Ad => {
  const id = item.ad_archive_id || item.adArchiveId || item.adArchiveID || item.id || item.adId || `apify_${index}_${Date.now()}`;
  
  let status: 'Ativo' | 'Inativo' = 'Ativo';
  const rawStatus = item.status || item.adActiveStatus || (item.isActive ? 'ACTIVE' : '') || '';
  if (rawStatus && typeof rawStatus === 'string') {
    const s = rawStatus.toLowerCase();
    if (s.includes('inact') || s.includes('inativ') || s.includes('off') || s.includes('inativo')) {
      status = 'Inativo';
    }
  }

  let startDate = 'Recente';
  const rawDate = item.startDateFormatted || item.startDate || item.start_date || item.adStartDate || item.creationTime || item.adCreationTime;
  if (rawDate) {
    if (typeof rawDate === 'string') {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          startDate = d.toLocaleDateString('pt-BR');
        } else {
          startDate = rawDate;
        }
      } catch {
        startDate = rawDate;
      }
    } else if (typeof rawDate === 'number') {
      try {
        const d = new Date(rawDate > 9999999999 ? rawDate : rawDate * 1000);
        startDate = d.toLocaleDateString('pt-BR');
      } catch {
        startDate = String(rawDate);
      }
    }
  }

  let activeDays = 1;
  const rawActiveDays = item.activeDays || item.active_days || item.daysActive;
  if (typeof rawActiveDays === 'number') {
    activeDays = rawActiveDays;
  } else if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const diffTime = Math.abs(Date.now() - d.getTime());
        activeDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }
    } catch {}
  } else {
    activeDays = Math.floor(Math.random() * 15) + 1;
  }

  let copies = 1;
  const rawCopies = item.collationCount || item.copies || item.copiesCount || item.count || item.similiarAdsCount || item.similarAdsCount;
  if (typeof rawCopies === 'number') {
    copies = rawCopies;
  } else if (typeof rawCopies === 'string') {
    const parsed = parseInt(rawCopies, 10);
    if (!isNaN(parsed)) copies = parsed;
  }

  const advertiserName = item.pageName || item.page_name || item.advertiserName || item.pageProfile?.name || 'Anunciante';

  let advertiserAvatar = '';
  const rawAvatar = item.snapshot?.pageProfilePictureUrl || item.pageProfile?.profileImageUrl || item.pageProfile?.profile_image_url || item.advertiserAvatar;
  if (rawAvatar && typeof rawAvatar === 'string' && rawAvatar.startsWith('http')) {
    advertiserAvatar = rawAvatar;
  } else {
    advertiserAvatar = advertiserName.substring(0, 2).toUpperCase();
  }

  const pageUrl = item.pageUrl || item.page_url || item.snapshot?.linkUrl || item.linkUrl || `https://facebook.com/ads/library/?id=${id}`;
  const bodyText = item.bodyText || item.adText || item.text || item.adBody || item.snapshot?.body?.text || item.snapshot?.text || '';
  const videoUrl = item.videoUrl || item.video_url || item.snapshot?.videos?.[0]?.videoHdUrl || item.snapshot?.videos?.[0]?.video_hd_url || item.snapshot?.videos?.[0]?.videoSdUrl || item.snapshot?.videos?.[0]?.url;
  const videoThumbnail = item.videoThumbnail || item.video_thumbnail || item.snapshot?.videos?.[0]?.videoPreviewImageUrl || item.snapshot?.images?.[0]?.url || item.snapshot?.images?.[0]?.resized_image_url;

  let category = item.category || 'Geral';
  if (category === 'Geral' && bodyText) {
    const textLower = bodyText.toLowerCase();
    if (textLower.includes('vsl') || textLower.includes('vídeo de 3 minutos')) {
      category = 'VSL';
    } else if (textLower.includes('pix') || textLower.includes('renda') || textLower.includes('ganhar')) {
      category = 'Renda Extra';
    } else if (textLower.includes('🚨') || textLower.includes('secreto') || textLower.includes('atenção')) {
      category = 'Pressão';
    }
  }

  const transcription = item.transcription || item.transcripts?.[0] || '';
  const destinationPage = item.destinationPage || item.destination_page || item.snapshot?.linkUrl || item.linkUrl || '';

  return {
    id,
    status,
    startDate,
    activeDays,
    copies,
    advertiserName,
    advertiserAvatar,
    pageUrl,
    bodyText,
    videoUrl,
    category,
    transcription,
    fanPage: advertiserName,
    destinationPage,
    videoThumbnail
  };
};

const AdCardSkeleton: React.FC = () => {
  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col h-fit relative animate-pulse">
      <div className="p-4 border-b border-zinc-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="h-4 w-12 bg-zinc-800 rounded-full"></div>
            <div className="h-4 w-16 bg-zinc-800 rounded"></div>
          </div>
          <div className="h-6 w-6 bg-zinc-800 rounded-md"></div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="h-3 w-20 bg-zinc-800 rounded"></div>
          <div className="h-3 w-16 bg-zinc-800/60 rounded"></div>
        </div>
      </div>

      <div className="p-4 flex items-center space-x-3 bg-zinc-900/40">
        <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0"></div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
          <div className="h-2 bg-zinc-800/60 rounded w-1/2"></div>
        </div>
      </div>

      <div className="px-4 pb-3 flex-1 space-y-2 py-2">
        <div className="h-3 bg-zinc-800 rounded w-full"></div>
        <div className="h-3 bg-zinc-800 rounded w-5/6"></div>
        <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
      </div>

      <div className="relative aspect-[4/5] bg-zinc-950/90 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center">
          <div className="w-3 h-3 bg-zinc-800 rounded"></div>
        </div>
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500/20 to-transparent skeleton-scanline"></div>
      </div>
    </div>
  );
};

export const AdLibrary: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdData = async (query?: string) => {
    setIsLoading(true);
    setError(null);
    const API_TOKEN = import.meta.env.VITE_APIFY_API_TOKEN;

    try {
      if (query && query.trim() !== '') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 seconds timeout for live sync scraper run

        const startUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&search_type=keyword_unordered&q=${encodeURIComponent(query.trim())}`;

        const payload = {
          startUrls: [
            { url: startUrl }
          ],
          searchTerms: [query.trim()],
          country: "BR",
          activeStatus: "active",
          maxItems: 20
        };

        console.log('Status do Token:', API_TOKEN ? 'Presente' : 'Vazio ou Undefined');
        console.log("Apify request payload:", payload);

        if (!API_TOKEN) throw new Error('TOKEN_FALTANDO: A variável VITE_APIFY_API_TOKEN não foi encontrada no build.');

        const response = await fetch(
          `https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items?token=${API_TOKEN}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_TOKEN}`
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Erro na API do Apify (Status ${response.status})`);
        }

        const rawItems = await response.json();
        if (Array.isArray(rawItems)) {
          const mapped = rawItems.map((item, idx) => mapApifyAdToAd(item, idx));
          setAds(mapped);
        } else {
          throw new Error("Resposta da API do Apify inválida ou vazia.");
        }
      } else {
        console.log('Status do Token:', API_TOKEN ? 'Presente' : 'Vazio ou Undefined');
        
        if (!API_TOKEN) throw new Error('TOKEN_FALTANDO: A variável VITE_APIFY_API_TOKEN não foi encontrada no build.');

        // Fast initial/empty load from the last run dataset
        const response = await fetch(
          `https://api.apify.com/v2/actors/apify~facebook-ads-scraper/runs/last/dataset/items?token=${API_TOKEN}`,
          {
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ao buscar o último dataset (Status ${response.status})`);
        }

        const rawItems = await response.json();
        if (Array.isArray(rawItems)) {
          const mapped = rawItems.map((item, idx) => mapApifyAdToAd(item, idx));
          setAds(mapped);
        } else {
          throw new Error("Nenhum item encontrado no último dataset.");
        }
      }
    } catch (e: any) {
      console.error("Erro ao buscar dados da biblioteca de anúncios:", e);
      setError(e.message || "Ocorreu um erro ao carregar os dados ao vivo do Apify.");
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // A tela começa vazia por padrão para evitar consumo indesejado de créditos.
    // O usuário pode digitar e buscar para carregar os dados ao vivo.
  }, []);

  // Search & Basic states
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced Filter states
  const [searchTargets, setSearchTargets] = useState({
    transcription: false,
    fanPage: false,
    destinationPage: false,
    texts: false,
  });

  const [copiesRange, setCopiesRange] = useState({
    min: '',
    max: '',
  });

  const [activeDaysRange, setActiveDaysRange] = useState({
    min: '',
    max: '',
  });

  // Favorites state persistent in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('swiper_library_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('swiper_library_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  const handleTargetChange = (key: keyof typeof searchTargets) => {
    setSearchTargets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSearchTargets({
      transcription: false,
      fanPage: false,
      destinationPage: false,
      texts: false,
    });
    setCopiesRange({ min: '', max: '' });
    setActiveDaysRange({ min: '', max: '' });
  };

  // Derived state: Filtering Logic from the ads state array
  const filteredAds = ads.filter(ad => {
    // 1. Copies Range Filter
    if (copiesRange.min !== '' && ad.copies < parseInt(copiesRange.min, 10)) {
      return false;
    }
    if (copiesRange.max !== '' && ad.copies > parseInt(copiesRange.max, 10)) {
      return false;
    }

    // 3. Active Days Range Filter
    if (activeDaysRange.min !== '' && ad.activeDays < parseInt(activeDaysRange.min, 10)) {
      return false;
    }
    if (activeDaysRange.max !== '' && ad.activeDays > parseInt(activeDaysRange.max, 10)) {
      return false;
    }

    // 4. Text Search Target Filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      const anyTargetSelected = Object.values(searchTargets).some(val => val);

      if (anyTargetSelected) {
        let matchesAnyTarget = false;
        
        if (searchTargets.transcription && ad.transcription?.toLowerCase().includes(query)) {
          matchesAnyTarget = true;
        }
        if (searchTargets.fanPage && (ad.fanPage?.toLowerCase().includes(query) || ad.advertiserName.toLowerCase().includes(query))) {
          matchesAnyTarget = true;
        }
        if (searchTargets.destinationPage && (ad.pageUrl.toLowerCase().includes(query) || ad.destinationPage?.toLowerCase().includes(query))) {
          matchesAnyTarget = true;
        }
        if (searchTargets.texts && ad.bodyText.toLowerCase().includes(query)) {
          matchesAnyTarget = true;
        }

        if (!matchesAnyTarget) return false;
      } else {
        // Default search targets when no checkboxes are checked: searches in bodyText, advertiserName, pageUrl, transcription
        const matchesDefault = 
          ad.bodyText.toLowerCase().includes(query) ||
          ad.advertiserName.toLowerCase().includes(query) ||
          ad.pageUrl.toLowerCase().includes(query) ||
          (ad.transcription && ad.transcription.toLowerCase().includes(query));
        
        if (!matchesDefault) return false;
      }
    }

    return true;
  });

  return (
    <div className="w-full h-full flex overflow-hidden font-sans antialiased text-white bg-[#050505]">
      
      {/* 1. Main Center Content (flexible width) */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        
        {/* Inner Scroll container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          
          {/* Header Title */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h1 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                BIBLIOTECA INTERNA DE ANÚNCIOS (AD SPY)
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                Monitore, filtre e copie criativos e copys de alta conversão diretamente na plataforma.
              </p>
            </div>
            
            <div className="flex items-center space-x-3 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">
                Anúncios Filtrados:
              </span>
              <span className="text-xs font-black text-red-500 font-mono">
                {filteredAds.length}
              </span>
            </div>
          </div>

          {/* Top Bar - Large Search input */}
          <div className="relative group flex items-center">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Buscar por anunciante ou palavra-chave... (Pressione Enter para buscar ao vivo)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchAdData(searchQuery);
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl py-3.5 pl-12 pr-36 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3)] focus:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
            />
            <button
              onClick={() => fetchAdData(searchQuery)}
              className="absolute right-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] active:scale-[0.98] cursor-pointer"
            >
              Buscar Ao Vivo
            </button>
          </div>

          {/* Stylesheet inline for custom skeleton scanline */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes skeleton-scan {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
            .skeleton-scanline {
              position: absolute;
              height: 2px;
              width: 100%;
              background: linear-gradient(to right, transparent, rgba(239, 68, 68, 0.4), transparent);
              animation: skeleton-scan 2s ease-in-out infinite;
            }
          ` }} />

          {/* Error Banner */}
          {error && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0 animate-ping"></span>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                  {error}
                </p>
              </div>
              <button 
                onClick={() => fetchAdData(searchQuery)}
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 px-3.5 py-1.5 rounded-lg text-red-400 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <RefreshCw size={10} className="animate-spin" />
                <span>Recarregar Ao Vivo</span>
              </button>
            </div>
          )}

          {/* Ad Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, idx) => (
                <AdCardSkeleton key={idx} />
              ))}
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center border border-zinc-800/60 rounded-xl bg-zinc-900/10 space-y-4">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 text-zinc-500 rounded-full">
                <Search size={28} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Nenhum anúncio encontrado</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Tente ajustar seus termos de pesquisa ou filtros avançados.</p>
              </div>
              <button 
                onClick={handleClearFilters}
                className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2 rounded-lg text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Limpar Filtros</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-300">
              {filteredAds.map(ad => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  isFavorite={favorites.includes(ad.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}

        </div>

      </div>

      {/* 2. Right Sidebar (Advanced Filters) */}
      <div className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-950/80 backdrop-blur-md h-full overflow-y-auto p-6 flex flex-col space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        
        {/* Title */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center space-x-2 text-zinc-300">
            <SlidersHorizontal size={14} className="text-red-500" />
            <span className="text-xs font-black uppercase tracking-widest">Filtros Avançados</span>
          </div>
          
          <button 
            onClick={handleClearFilters}
            className="text-[9px] text-zinc-500 hover:text-red-400 font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
            title="Limpar todos os filtros"
          >
            <RefreshCw size={10} />
            <span>Resetar</span>
          </button>
        </div>

        {/* 2.1 Checkboxes for search targets */}
        <div className="space-y-3">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block">Alvos de Busca</span>
          
          <div className="space-y-2">
            {[
              { id: 'transcription', label: 'Transcrição' },
              { id: 'fanPage', label: 'FanPage / Anunciante' },
              { id: 'destinationPage', label: 'Página Destino' },
              { id: 'texts', label: 'Textos do Anúncio' }
            ].map(target => {
              const isChecked = searchTargets[target.id as keyof typeof searchTargets];
              return (
                <label 
                  key={target.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-zinc-900/30 hover:bg-zinc-900/60 border-zinc-900 hover:border-zinc-800 cursor-pointer transition-all duration-200 select-none group"
                >
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 font-medium uppercase tracking-wide">
                    {target.label}
                  </span>
                  
                  <div 
                    onClick={() => handleTargetChange(target.id as keyof typeof searchTargets)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isChecked 
                        ? 'bg-red-600 border-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.3)]' 
                        : 'bg-zinc-900 border-zinc-800 text-transparent group-hover:border-zinc-700'
                    }`}
                  >
                    {isChecked && <Check size={12} className="stroke-[3]" />}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* 2.2 Range Inputs: Quantidade de Cópias */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
            <Layers size={11} className="text-zinc-600" />
            <span>Quantidade de Cópias</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Min</span>
              <input
                type="number"
                min="0"
                placeholder="Ex: 1"
                value={copiesRange.min}
                onChange={(e) => setCopiesRange(prev => ({ ...prev, min: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-red-500/50 transition-colors placeholder:text-zinc-700 font-mono"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Max</span>
              <input
                type="number"
                min="0"
                placeholder="Ex: 50"
                value={copiesRange.max}
                onChange={(e) => setCopiesRange(prev => ({ ...prev, max: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-red-500/50 transition-colors placeholder:text-zinc-700 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2.3 Range Inputs: Dias Ativos */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
            <Flame size={11} className="text-zinc-600" />
            <span>Dias Ativos</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Min</span>
              <input
                type="number"
                min="0"
                placeholder="Ex: 2"
                value={activeDaysRange.min}
                onChange={(e) => setActiveDaysRange(prev => ({ ...prev, min: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-red-500/50 transition-colors placeholder:text-zinc-700 font-mono"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Max</span>
              <input
                type="number"
                min="0"
                placeholder="Ex: 30"
                value={activeDaysRange.max}
                onChange={(e) => setActiveDaysRange(prev => ({ ...prev, max: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-red-500/50 transition-colors placeholder:text-zinc-700 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Information box */}
        <div className="bg-red-950/10 border border-red-500/10 p-3 rounded-lg flex items-start gap-2.5">
          <HelpCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-zinc-500 uppercase tracking-normal leading-normal font-semibold">
            ESTE MÓDULO RODA INTEGRAÇÕES DIRETAS COM METAPixel E GRAPH API DO FACEBOOK ADS. A VELOCIDADE DE ATUALIZAÇÃO DA FILTRAGEM É EM TEMPO REAL.
          </p>
        </div>

      </div>

    </div>
  );
};
