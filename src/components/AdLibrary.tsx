import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { AdCard, Ad } from './AdCard';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AdCardSkeleton: React.FC = () => (
  <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg flex flex-col h-fit animate-pulse p-4">
    <div className="h-40 bg-zinc-800/50 rounded-lg"></div>
  </div>
);

export const AdLibrary: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('swiper_library_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchAdData = async (niche: string) => {
    setIsLoading(true);
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
    } catch (e) {
      console.error("Erro ao carregar anúncios:", e);
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

  const filteredAds = ads.filter(ad =>
    ad.bodyText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ad.advertiserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <select value={selectedNiche} onChange={(e) => setSelectedNiche(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs">
          <option value="">TODOS OS NICHOS</option>
          <option value="truque">TRUQUE</option>
          <option value="emagrecimento">EMAGRECIMENTO</option>
          <option value="renda extra">RENDA EXTRA</option>
        </select>
        <button onClick={() => fetchAdData(selectedNiche)} className="bg-red-600 p-2.5 rounded-lg"><RefreshCw size={18} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <AdCardSkeleton key={i} />) :
          filteredAds.map(ad => <AdCard key={ad.id} ad={ad} isFavorite={favorites.includes(ad.id)} onToggleFavorite={(id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])} />)}
      </div>
    </div>
  );
};