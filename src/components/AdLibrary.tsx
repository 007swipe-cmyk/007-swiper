import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { AdCard, Ad } from './AdCard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const getAdLanguage = (ad: any) => {
  if (ad.idioma) return ad.idioma.toUpperCase();
  const text = `${ad.category || ad.nicho} ${ad.bodyText || ad.texto}`.toLowerCase();
  
  if (/perte|poids|gagner|argent|astuce|rencontre|vos/i.test(text)) return 'FR';
  if (/weight|loss|dating|crypto|make|money/i.test(text)) return 'EN';
  if (/perder|peso|ganar|dinero|truco|apuestas/i.test(text)) return 'ES';
  
  return 'PT';
};

const AdCardSkeleton: React.FC = () => (
  <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg flex flex-col h-fit animate-pulse p-4">
    <div className="h-40 bg-zinc-800/50 rounded-lg"></div>
  </div>
);

export const getDaysRunning = (ad: any) => {
  const rawDate = ad.dataInicio || ad.dataCaptura || ad.startDate;
  if (!rawDate) return 1;
  
  const startDate = new Date(rawDate);
  if (isNaN(startDate.getTime())) return 1;
  
  const now = new Date();
  const diffTime = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 1 ? diffDays : 1;
};

export const getNormalizedCategory = (ad: any) => {
  const cat = (ad.categoria || ad.nicho || ad.category || '').toString().toLowerCase().trim();

  if (/weight|loss|quema|grasa|emagrecimento|perte_de_poids/i.test(cat)) return 'EMAGRECIMENTO';
  if (/make|money|renda|extra|ganhar|dinheiro|gagner/i.test(cat)) return 'RENDA EXTRA';
  if (/truque|truques|trick|astuce/i.test(cat)) return 'TRUQUES';
  if (/aposta|apostas|bet|igaming|casino|paris_sportifs/i.test(cat)) return 'APOSTAS';
  if (/amor|relacionamento|dating|relaciones|rencontre/i.test(cat)) return 'RELACIONAMENTO';
  if (/estetica|beleza|rejuvenescimento|anti_aging|anti_age|rejuvenecimiento/i.test(cat)) return 'BELEZA & ESTÉTICA';
  if (/saude|diabetes|dor|dores|joint_pain|dolor|mal_de_dos|prostate|prostata/i.test(cat)) return 'SAÚDE & DORES';

  return cat ? cat.toUpperCase() : null;
};

export const AdLibrary: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedLang, setSelectedLang] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('TODOS');
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
          dataCaptura: data.dataCaptura || '',
          categoria: data.categoria || data.nicho || 'Geral',
          idioma: data.idioma || 'pt'
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
  }, [selectedCategory, selectedLang, searchQuery, selectedPeriod, copiesFilter]);

  const availableCategories = useMemo(() => {
    const cats = ads
      .map(ad => getNormalizedCategory(ad))
      .filter((cat): cat is any => Boolean(cat) && (cat as any) !== 'GERAL') as string[];
    return Array.from(new Set(cats)).sort();
  }, [ads]);

  const getActiveTagLabel = (category: string, lang: string) => {
    const cat = category.toLowerCase();
    const lg = lang.toLowerCase();

    if (cat === 'emagrecimento' || cat === 'weight_loss' || cat === 'perda_de_peso') {
      if (lg === 'en') return 'weight loss';
      if (lg === 'es') return 'pérdida de peso';
      return 'emagrecimento';
    }
    if (cat === 'renda extra' || cat === 'renda_extra' || cat === 'make_money') {
      if (lg === 'en') return 'make money';
      if (lg === 'es') return 'ganar dinero';
      return 'renda extra';
    }
    if (cat === 'truque' || cat === 'truques' || cat === 'hacks') {
      if (lg === 'en') return 'secret hacks';
      if (lg === 'es') return 'truco secreto';
      return 'truques';
    }
    if (cat === 'apostas' || cat === 'betting' || cat === 'casino') {
      if (lg === 'en') return 'betting / casino';
      if (lg === 'es') return 'apuestas';
      return 'apostas';
    }
    if (cat === 'relacionamento' || cat === 'dating' || cat === 'amor') {
      if (lg === 'en') return 'dating / relationships';
      if (lg === 'es') return 'relaciones';
      return 'relacionamento';
    }

    if (lg !== 'todos' && lg !== 'todas') {
      return `${category} (${lang})`;
    }
    return category;
  };

  const formatCategoryLabel = (cat: string) => {
    const c = cat.toLowerCase().replace(/_/g, ' ');
    if (c === 'emagrecimento') return 'Emagrecimento';
    if (c === 'renda extra') return 'Renda Extra';
    if (c === 'truque' || c === 'truques') return 'Truques';
    if (c === 'apostas') return 'Apostas';
    return c.charAt(0).toUpperCase() + c.slice(1);
  };

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

    const matchesLanguage = selectedLang === 'TODOS' || getAdLanguage(ad) === selectedLang;

    const matchesCategory = selectedCategory === 'TODAS' || getNormalizedCategory(ad) === selectedCategory;

    const matchesPeriod = () => {
      if (selectedPeriod === 'TODOS') return true;
      const minDays = parseInt(selectedPeriod, 10);
      const daysRunning = getDaysRunning(ad);
      return daysRunning >= minDays;
    };

    let matchesCopies = true;
    if (copiesFilter === '2') {
      matchesCopies = ad.copies >= 2;
    } else if (copiesFilter === '5') {
      matchesCopies = ad.copies >= 5;
    } else if (copiesFilter === '10') {
      matchesCopies = ad.copies >= 10;
    }

    return matchesSearch && matchesLanguage && matchesCategory && matchesPeriod() && matchesCopies;
  });

  return (
    <div className="w-full h-full flex flex-col p-6 bg-[#050505] text-white">
      <h1 className="text-lg font-black uppercase mb-6">ADS SPY FACEBOOK</h1>

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
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-semibold uppercase tracking-wider"
        >
          <option value="TODAS">TODAS AS CATEGORIAS</option>
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>{formatCategoryLabel(cat).toUpperCase()}</option>
          ))}
        </select>

        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-semibold uppercase tracking-wider"
        >
          <option value="TODOS">🌐 Todos os Idiomas</option>
          <option value="PT">🇵🇹 Português</option>
          <option value="EN">🇺🇸 Inglês</option>
          <option value="ES">🇪🇸 Espanhol</option>
          <option value="FR">🇫🇷 Francês</option>
        </select>

        <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-semibold uppercase tracking-wider">
          <option value="TODOS">Todos os Períodos</option>
          <option value="3">Ativo há +3 dias</option>
          <option value="7">Ativo há +7 dias</option>
          <option value="15">Ativo há +15 dias</option>
          <option value="30">Ativo há +30 dias</option>
        </select>

        <select value={copiesFilter} onChange={(e) => setCopiesFilter(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs font-semibold uppercase tracking-wider">
          <option value="all">TODAS AS CÓPIAS</option>
          <option value="2">2+ CÓPIAS</option>
          <option value="5">5+ CÓPIAS</option>
          <option value="10">10+ CÓPIAS</option>
        </select>

        <button onClick={() => fetchAdData()} className="bg-red-600 p-2.5 rounded-lg hover:bg-red-700 transition-colors"><RefreshCw size={18} /></button>
      </div>

      {/* Active Search Tag */}
      {selectedCategory !== 'TODAS' && selectedLang !== 'TODOS' && (
        <div className="flex items-center gap-2 mb-6 bg-zinc-900/60 border border-zinc-800/80 px-4 py-2 rounded-xl w-fit text-xs text-zinc-400">
          <span>Busca ativa na Meta API:</span>
          <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 font-black px-2.5 py-1 rounded uppercase tracking-widest text-[10px] animate-pulse">
            "{getActiveTagLabel(selectedCategory, selectedLang)}"
          </span>
        </div>
      )}

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