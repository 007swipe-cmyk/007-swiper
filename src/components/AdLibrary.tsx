import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Check, RefreshCw, Layers, Flame, HelpCircle } from 'lucide-react';
import { AdCard, Ad } from './AdCard';

const INITIAL_MOCK_ADS: Ad[] = [
  {
    id: 'ad_1',
    status: 'Ativo',
    startDate: '12/06/2026',
    activeDays: 9,
    copies: 5,
    advertiserName: 'Nicho Black Caps',
    advertiserAvatar: 'BC',
    pageUrl: 'https://desafio-zero-barriga.online/promocao',
    bodyText: '🚨 ÚLTIMA CHANCE: O método secreto que secou mais de 15.000 pessoas sem dietas malucas ou exercícios cansativos. Assista ao vídeo de 3 minutos e descubra como ativar o receptor de queima rápida hoje mesmo. Estoque limitado do ativador natural no Brasil!',
    category: 'Pressão',
    transcription: 'seja muito bem-vindo a essa apresentação hoje vou te revelar o segredo para ativar sua queima de gordura profunda de forma 100% natural',
    fanPage: 'Nicho Black Caps Oficial',
    destinationPage: 'https://desafio-zero-barriga.online/checkout-vip'
  },
  {
    id: 'ad_2',
    status: 'Inativo',
    startDate: '15/04/2026',
    activeDays: 60,
    copies: 32,
    advertiserName: 'Premium Dropshipping',
    advertiserAvatar: 'PD',
    pageUrl: 'https://lojapremium.com.br/relogio-tatico',
    bodyText: '⌚️ Relógio Militar Titanium - O acessório indestrutível preferido das forças especiais americanas. À prova d\'água, ultra resistente e com vidro de safira anti-riscos. Garanta 50% de DESCONTO e Frete Grátis apenas hoje clicando no botão!',
    category: 'Geral',
    transcription: 'conheça o relógio de titânio indestrutível militar o mais resistente do mundo importado diretamente com preço de fábrica',
    fanPage: 'Premium Dropshipping Brasil',
    destinationPage: 'https://lojapremium.com.br/relogio-tatico/comprar'
  },
  {
    id: 'ad_3',
    status: 'Ativo',
    startDate: '18/06/2026',
    activeDays: 3,
    copies: 1,
    advertiserName: 'App Renda Extra',
    advertiserAvatar: 'RE',
    pageUrl: 'https://ganhos-diarios.app/cadastro',
    bodyText: '💸 Trabalhe de casa avaliando marcas famosas e receba de R$ 50 a R$ 150 por dia diretamente no seu Pix. Sem taxas ocultas, faça sua primeira retirada ainda hoje. Restam apenas 17 vagas para novos testadores em sua região!',
    category: 'Renda Extra',
    transcription: 'olha só esse pix que acabou de cair na minha conta apenas por avaliar cinco peças de roupas no meu celular hoje mesmo',
    fanPage: 'Trabalho Inteligente Inc',
    destinationPage: 'https://ganhos-diarios.app/auth'
  },
  {
    id: 'ad_4',
    status: 'Ativo',
    startDate: '05/06/2026',
    activeDays: 16,
    copies: 14,
    advertiserName: 'Alfa Suplementos',
    advertiserAvatar: 'AS',
    pageUrl: 'https://alfa-testo.com/promocao-especial',
    bodyText: '🔥 Recupere a energia de quando você tinha 20 anos. Fórmula 100% natural com feno grego e maca peruana concentrada. Sinta a diferença nas primeiras 48 horas de uso. Compre 3 potes e leve 5 com frete gratuito.',
    category: 'Pressão',
    transcription: 'se você se sente cansado sem energia ao longo do dia esse novo composto natural vai devolver toda a sua vitalidade e foco',
    fanPage: 'Alfa Suplementos Saúde',
    destinationPage: 'https://alfa-testo.com/checkout'
  },
  {
    id: 'ad_5',
    status: 'Inativo',
    startDate: '20/05/2026',
    activeDays: 12,
    copies: 2,
    advertiserName: 'Expert Launch Academy',
    advertiserAvatar: 'EL',
    pageUrl: 'https://expertlaunch.site/vsl-vendas',
    bodyText: '🎯 Chega de tentar vender com páginas amadoras. Descubra a estrutura exata de VSL de 7 dígitos que converte tráfego frio em compradores recorrentes. Baixe o template em PDF e comece a gravar o seu roteiro validado hoje.',
    category: 'VSL',
    transcription: 'hoje eu vou te dar o modelo pronto de vsl de vendas que nós usamos nos bastidores para faturar múltiplos milhões de reais',
    fanPage: 'Expert Launch Treinamentos',
    destinationPage: 'https://expertlaunch.site/obrigado-vsl'
  },
  {
    id: 'ad_6',
    status: 'Ativo',
    startDate: '21/06/2026',
    activeDays: 1,
    copies: 3,
    advertiserName: 'Segredos da Conversão',
    advertiserAvatar: 'SC',
    pageUrl: 'https://segredosconversao.com/truque-secreto',
    bodyText: '💡 O truque definitivo para triplicar as vendas da sua página. Revelamos o truque simples de design que os maiores e-commerces usam para reter os clientes. Clique em saiba mais e aplique hoje mesmo.',
    category: 'Geral',
    transcription: 'neste vídeo vou te mostrar o truque simples que aumentou nossas conversões em mais de trezentos por cento sem mudar o preço',
    fanPage: 'Segredos da Conversão Fanpage',
    destinationPage: 'https://segredosconversao.com/checkout-truque'
  }
];

export const AdLibrary: React.FC = () => {
  // Internal State Array of Mock Ads
  const [ads] = useState<Ad[]>(INITIAL_MOCK_ADS);

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
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Buscar por anunciante, palavras-chave do texto, transcrições..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl py-3.5 pl-12 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3)] focus:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
            />
          </div>

          {/* Ad Grid */}
          {filteredAds.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
