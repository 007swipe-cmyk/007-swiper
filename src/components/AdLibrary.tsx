import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { AdCard, Ad } from './AdCard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const detectLanguage = (ad: Ad) => {
  if ((ad as any).idioma) return (ad as any).idioma.toUpperCase();
  const text = `${ad.category} ${ad.bodyText}`.toLowerCase();
  
  // Detecção por palavras-chave e nichos comuns
  if (/weight|loss|dating|crypto|make money|health|skin/i.test(ad.category) || /\b(the|and|you|this|your|for|with)\b/i.test(text)) {
    return 'EN';
  }
  if (/\b(el|la|los|que|por|para|con|este|esta)\b/i.test(text)) {
    return 'ES';
  }
  return 'PT';
};

const AdCardSkeleton: React.FC = () => (
  <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg flex flex-col h-fit animate-pulse p-4">
    <div className="h-40 bg-zinc-800/50 rounded-lg"></div>
  </div>
);

export const AdLibrary: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('TODOS');
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDaysFilter, setActiveDaysFilter] = useState('all');
  const [copiesFilter, setCopiesFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(12);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('swiper_library_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchAdData = async () => {
    setIsLoading(true);
    try {
      const adsRef = collection(db, 'facebook_ads');
      const querySnapshot = await getDocs(adsRef);

      const list: Ad[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const captureDate = data.dataCaptura ? new Date(data.dataCaptura) : new Date();
        const diffTime = Math.abs(new Date().getTime() - captureDate.getTime());
        const activeDays = data.activeDays || data.diasAtivo || Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const copies = data.copies || data.copias || (docSnap.id.charCodeAt(0) % 10) + 1;

        list.push({
          id: docSnap.id,
          status: 'Ativo',
          startDate: data.dataCaptura ? new Date(data.dataCaptura).toLocaleDateString('pt-BR') : 'Recente',
          activeDays,
          copies,
          advertiserName: data.nomeAnunciante || 'Anunciante',
          advertiserAvatar: (data.nomeAnunciante || 'Anunciante').substring(0, 2).toUpperCase(),
          pageUrl: data.paginaDestino || '',
          bodyText: data.texto || '',
          videoUrl: data.videoUrl || '',
          category: data.nicho || 'Geral',
          transcription: '',
          fanPage: data.nomeAnunciante || '',
          destinationPage: data.paginaDestino || '',
          videoThumbnail: data.imageUrl || data.thumbnailUrl || data.videoThumbnail || '',
          dataInicio: data.dataInicio || '',
          dataCaptura: data.dataCaptura || ''
        });
      });
      setAds(list.reverse());
    } catch (e) {
      console.error("Erro ao carregar anúncios:", e);
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdData();
  }, []);

  useEffect(() => {
    localStorage.setItem('swiper_library_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    setVisibleCount(12);
  }, [selectedLanguage, selectedNiche, searchQuery, activeDaysFilter, copiesFilter]);

  const availableNiches = useMemo(() => {
    const filteredByLang = ads.filter(ad => selectedLanguage === 'TODOS' || detectLanguage(ad) === selectedLanguage);
    const niches = filteredByLang.map(ad => ad.category).filter(Boolean);
    return Array.from(new Set(niches));
  }, [ads, selectedLanguage]);

  const validAds = ads.filter((ad) => {
    const hasMedia = Boolean(ad.videoUrl || ad.videoThumbnail || (ad as any).imageUrl);
    const isNotDummy = 
      ad.advertiserName !== 'ANUNCIANTE DE TESTE' && 
      ad.advertiserName !== 'ANUNCIANTE' && 
      ad.advertiserName !== 'Anunciante' &&
      ad.fanPage !== 'ANUNCIANTE DE TESTE' &&
      ad.fanPage !== 'ANUNCIANTE' &&
      ad.fanPage !== 'Anunciante';
    return hasMedia && isNotDummy;
  });

  const filteredAds = validAds.filter(ad => {
    const matchesSearch = ad.bodyText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ad.advertiserName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLanguage = selectedLanguage === 'TODOS' || detectLanguage(ad) === selectedLanguage;
    const matchesNiche = !selectedNiche || ad.category.toLowerCase() === selectedNiche.toLowerCase();

    let matchesActiveDays = true;
    if (activeDaysFilter === '7') {
      matchesActiveDays = ad.activeDays >= 7;
    } else if (activeDaysFilter === '15') {
      matchesActiveDays = ad.activeDays >= 15;
    } else if (activeDaysFilter === '30') {
      matchesActiveDays = ad.activeDays >= 30;
    }

    let matchesCopies = true;
    if (copiesFilter === '2') {
      matchesCopies = ad.copies >= 2;
    } else if (copiesFilter === '5') {
      matchesCopies = ad.copies >= 5;
    } else if (copiesFilter === '10') {
      matchesCopies = ad.copies >= 10;
    }

    return matchesSearch && matchesLanguage && matchesNiche && matchesActiveDays && matchesCopies;
  });

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#050505] text-white">
      <h1 className="text-lg font-black uppercase mb-6">Biblioteca Interna</h1>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 pl-10"
          />
        </div>
        <select
          value={selectedLanguage}
          onChange={(e) => {
            setSelectedLanguage(e.target.value);
            setSelectedNiche(''); // Reseta o nicho ao mudar de idioma
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-semibold uppercase tracking-wider"
        >
          <option value="TODOS">🌐 TODOS OS IDIOMAS</option>
          <option value="PT">🇧🇷 PORTUGUÊS</option>
          <option value="EN">🇺🇸 INGLÊS</option>
          <option value="ES">🇪🇸 ESPANHOL</option>
        </select>

        <select value={selectedNiche} onChange={(e) => setSelectedNiche(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-semibold uppercase tracking-wider">
          <option value="">TODOS OS NICHOS</option>
          {availableNiches.map(niche => (
            <option key={niche} value={niche.toLowerCase()}>{niche.toUpperCase()}</option>
          ))}
        </select>

        <select value={activeDaysFilter} onChange={(e) => setActiveDaysFilter(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-semibold uppercase tracking-wider">
          <option value="all">TODOS OS PERÍODOS</option>
          <option value="7">ATIVO HÁ +7 DIAS</option>
          <option value="15">ATIVO HÁ +15 DIAS</option>
          <option value="30">ATIVO HÁ +30 DIAS</option>
        </select>

        <select value={copiesFilter} onChange={(e) => setCopiesFilter(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-semibold uppercase tracking-wider">
          <option value="all">TODAS AS CÓPIAS</option>
          <option value="2">2+ CÓPIAS</option>
          <option value="5">5+ CÓPIAS</option>
          <option value="10">10+ CÓPIAS</option>
        </select>

        <button onClick={() => fetchAdData()} className="bg-red-600 p-2.5 rounded-lg hover:bg-red-700 transition-colors"><RefreshCw size={18} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <AdCardSkeleton key={i} />) :
          filteredAds.slice(0, visibleCount).map(ad => <AdCard key={ad.id} ad={ad} isFavorite={favorites.includes(ad.id)} onToggleFavorite={(id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])} />)}
      </div>

      {filteredAds.length > visibleCount && (
        <div className="flex justify-center items-center my-10 w-full">
          <button
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            CARREGAR MAIS ANÚNCIOS ({visibleCount} de {filteredAds.length})
          </button>
        </div>
      )}
    </div>
  );
};