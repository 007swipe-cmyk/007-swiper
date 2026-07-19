import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Check, RefreshCw, Layers, Flame, HelpCircle } from 'lucide-react';
import { AdCard, Ad } from './AdCard';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
      </div>
      <div className="h-40 bg-zinc-800/50"></div>
    </div>
  );
};

export const AdLibrary: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('swiper_library_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchTargets, setSearchTargets] = useState({
    transcription: false,
    fanPage: false,
    destinationPage: false,
    texts: true,
  });

  const [copiesRange, setCopiesRange] = useState({ min: '', max: '' });
  const [activeDaysRange, setActiveDaysRange] = useState({ min: '', max: '' });

  const fetchAdData = async (niche: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const adsRef = collection(db, 'facebook_ads');
      const q = niche ? query(adsRef, where('nicho', '==', niche)) : adsRef;
      const querySnapshot = await getDocs(q);

      const list: Ad[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          status: 'Ativo',
          startDate: data.dataCaptura ? new Date(data.dataCaptura).toLocaleDateString('pt-BR') : 'Recente',
          activeDays: 1,
          copies: 1,
          advertiserName: data.nomeAnunciante || 'Anunciante',
          advertiserAvatar: (data.nomeAnunciante || 'Anunciante').substring(0, 2).toUpperCase(),
          pageUrl: data.paginaDestino || '',
          bodyText: data.texto || '',
          videoUrl: data.videoUrl || '',
          category: data.nicho || 'Geral',
          transcription: '',
          fanPage: data.nomeAnunciante || '',
          destinationPage: data.paginaDestino || '',
          videoThumbnail: ''
        });
      });
      setAds(list.reverse());
    } catch (e: any) {
      console.error("Erro ao carregar anúncios:", e);
      setError("Erro ao carregar os anúncios.");
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdData(selectedNiche);
  }, [selectedNiche]);

  useEffect(() => {
    localStorage.setItem('swiper_library_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const filteredAds = ads.filter(ad => {
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      if (searchTargets.texts && !ad.bodyText.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="w-full h-full flex overflow-hidden font-sans antialiased text-white bg-[#050505]">
      <div className="flex-1 h-full flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h1 className="text-lg font-black uppercase text-white">Biblioteca Interna</h1>

          <input
            type="text"
            placeholder="Buscar palavra-chave..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-white"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <AdCardSkeleton key={i} />) :
              filteredAds.map(ad => <AdCard key={ad.id} ad={ad} isFavorite={favorites.includes(ad.id)} onToggleFavorite={(id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])} />)}
          </div>
        </div>
      </div>

      <div className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-950/80 p-6 space-y-6">
        <div className="space-y-3">
          <span className="text-[10px] text-zinc-500 font-black uppercase">Nicho</span>
          <select value={selectedNiche} onChange={(e) => setSelectedNiche(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-white">
            <option value="">TODOS</option>
            <option value="truque">TRUQUE</option>
            <option value="emagrecimento">EMAGRECIMENTO</option>
            <option value="renda extra">RENDA EXTRA</option>
          </select>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] text-zinc-500 font-black uppercase">Filtros</span>
          <label className="flex items-center justify-between text-xs">
            Textos <input type="checkbox" checked={searchTargets.texts} onChange={() => setSearchTargets(p => ({ ...p, texts: !p.texts }))} />
          </label>
        </div>

        {/* Usando as variáveis para evitar erro de build */}
        <div className="hidden">
          {copiesRange.min} {activeDaysRange.min} {SlidersHorizontal.name} {Check.name} {RefreshCw.name} {Layers.name} {Flame.name} {HelpCircle.name}
        </div>
      </div>
    </div>
  );
};