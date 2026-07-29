import React, { useState } from 'react';
import { Star, ExternalLink, Calendar, Flame, Layers } from 'lucide-react';

export interface Ad {
  id: string;
  status: 'Ativo' | 'Inativo';
  startDate: string;
  activeDays: number;
  copies: number;
  advertiserName: string;
  advertiserAvatar: string;
  pageUrl: string;
  bodyText: string;
  videoUrl?: string;
  category: string;
  transcription?: string;
  fanPage?: string;
  destinationPage?: string;
  videoThumbnail?: string;
  dataInicio?: string;
  dataCaptura?: string;
  categoria?: string;
  idioma?: string;
}

interface AdCardProps {
  ad: Ad;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, isFavorite, onToggleFavorite }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Normalização de Variáveis
  const videoUrl = ad.videoUrl || (ad as any).video_url || '';
  const imageUrl = ad.videoThumbnail || (ad as any).imageUrl || (ad as any).image_url || '';

  // Capa Automática (Thumbnail Bunny)
  const posterUrl = imageUrl || (videoUrl.includes('b-cdn.net') ? videoUrl.replace(/play_\d+p\.mp4/, 'thumbnail.jpg') : '');

  const calcularDiasRodando = (ad: Ad) => {
    const dataInicioStr = ad.dataInicio || ad.dataCaptura;
    if (!dataInicioStr) return 1;
    
    const inicio = new Date(dataInicioStr);
    const hoje = new Date();
    const diffEmMs = hoje.getTime() - inicio.getTime();
    const dias = Math.floor(diffEmMs / (1000 * 60 * 60 * 24));
    
    return dias > 0 ? dias : 1;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-red-500/30 transition-all duration-300 flex flex-col group h-fit relative">
      
      {/* Top Header Card Info */}
      <div className="p-4 border-b border-zinc-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Status Badge */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              ad.status === 'Ativo' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              <span className={`w-1 h-1 rounded-full mr-1.5 ${ad.status === 'Ativo' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              {ad.status}
            </span>

            {/* Copies count badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 text-[9px] font-bold uppercase tracking-wider">
              <Layers size={10} className="mr-1 text-zinc-500" />
              {ad.copies} {ad.copies === 1 ? 'cópia' : 'cópias'}
            </span>
          </div>

          {/* Star Icon for Favorites */}
          <button
            onClick={() => onToggleFavorite(ad.id)}
            className="p-1.5 rounded-md bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/30 text-zinc-500 hover:text-red-500 transition-all duration-300"
            aria-label="Adicionar aos favoritos"
          >
            <Star 
              size={13} 
              className={`transition-transform duration-300 hover:scale-110 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-zinc-500'
              }`} 
            />
          </button>
        </div>

        {/* Date & Runtime Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500 font-medium tracking-wide">
          <div className="flex items-center">
            <Calendar size={11} className="mr-1.5 text-zinc-600" />
            <span>Início: {ad.startDate}</span>
          </div>
          <div className="flex items-center text-red-400 font-bold bg-red-950/20 px-2 py-0.5 rounded border border-red-950/30">
            <Flame size={11} className="mr-1 animate-pulse" />
            <span>Rodou por {calcularDiasRodando(ad)} {calcularDiasRodando(ad) === 1 ? 'dia' : 'dias'}</span>
          </div>
        </div>
      </div>

      {/* Advertiser Info */}
      <div className="p-4 flex items-center space-x-3 bg-zinc-900/40">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border border-zinc-700 text-white font-black text-xs">
            {ad.advertiserAvatar && ad.advertiserAvatar.startsWith('http') ? (
              <img
                src={ad.advertiserAvatar}
                alt={ad.advertiserName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : ad.advertiserAvatar ? (
              <span className="uppercase">{ad.advertiserAvatar}</span>
            ) : (
              <span className="uppercase">{ad.advertiserName.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-zinc-900 flex items-center justify-center">
            <span className="w-1 h-1 bg-white rounded-full"></span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-zinc-100 uppercase tracking-wide truncate">
            {ad.advertiserName}
          </h4>
          <a
            href={ad.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors flex items-center mt-0.5 group/link truncate"
          >
            <span className="truncate">{ad.pageUrl.replace(/^https?:\/\//, '')}</span>
            <ExternalLink size={8} className="ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>

      {/* Text Body */}
      <div className="px-4 pb-3 flex-1 flex flex-col justify-between">
        <div className="text-xs text-zinc-300 leading-relaxed font-sans font-normal relative">
          <p className={isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-3'}>
            {ad.bodyText}
          </p>
          {ad.bodyText.length > 120 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider mt-1.5 transition-colors inline-block focus:outline-none"
            >
              {isExpanded ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </div>
      </div>

      {/* Creative Media Simulator */}
      <div className="relative w-full h-80 bg-black overflow-hidden rounded-md flex items-center justify-center">
        {videoUrl ? (
          <video 
            src={videoUrl} 
            poster={posterUrl} 
            controls 
            preload="metadata" 
            className="w-full h-80 object-cover rounded-md bg-black"
          />
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Ad Creative" 
            className="w-full h-80 object-cover rounded-md bg-black"
          />
        ) : (
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px] w-full h-full"></div>
        )}
      </div>

    </div>
  );
};
