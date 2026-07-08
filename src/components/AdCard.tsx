import React, { useState } from 'react';
import { Star, Play, Volume2, VolumeX, ExternalLink, Calendar, Flame, Layers } from 'lucide-react';

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
}

interface AdCardProps {
  ad: Ad;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, isFavorite, onToggleFavorite }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-red-500/30 transition-all duration-300 flex flex-col group h-fit relative">
      
      {/* Top Header Card Info */}
      <div className="p-4 border-b border-zinc-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
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
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium tracking-wide">
          <div className="flex items-center">
            <Calendar size={11} className="mr-1.5 text-zinc-600" />
            <span>Início: {ad.startDate}</span>
          </div>
          <div className="flex items-center text-red-400 font-bold bg-red-950/20 px-2 py-0.5 rounded border border-red-950/30">
            <Flame size={11} className="mr-1 animate-pulse" />
            <span>Rodou por {ad.activeDays} {ad.activeDays === 1 ? 'dia' : 'dias'}</span>
          </div>
        </div>
      </div>

      {/* Advertiser Info */}
      <div className="p-4 flex items-center space-x-3 bg-zinc-900/40">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border border-zinc-700 text-white font-black text-xs">
            {ad.advertiserAvatar ? (
              <span className="uppercase">{ad.advertiserAvatar}</span>
            ) : (
              ad.advertiserName.substring(0, 2).toUpperCase()
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
      <div className="relative aspect-[4/5] bg-black group-hover:shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] overflow-hidden">
        {isPlaying ? (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-950">
            {/* Visual simulation waves */}
            <div className="flex items-center space-x-1.5 w-24 h-12 justify-center">
              <div className="w-1.5 bg-red-500 animate-[bounce_0.8s_infinite] h-8"></div>
              <div className="w-1.5 bg-red-500 animate-[bounce_0.8s_infinite_0.1s] h-12"></div>
              <div className="w-1.5 bg-red-500 animate-[bounce_0.8s_infinite_0.2s] h-6"></div>
              <div className="w-1.5 bg-red-500 animate-[bounce_0.8s_infinite_0.3s] h-10"></div>
              <div className="w-1.5 bg-red-500 animate-[bounce_0.8s_infinite_0.4s] h-4"></div>
            </div>
            
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-3 animate-pulse">
              Simulando Vídeo Criativo
            </p>
            
            {/* Control Bar overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/5 text-zinc-300 text-[10px] uppercase font-bold tracking-wider">
              <button 
                onClick={() => setIsPlaying(false)} 
                className="hover:text-red-500 transition-colors"
              >
                Pausar
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="hover:text-red-500 transition-colors flex items-center"
              >
                {isMuted ? <VolumeX size={12} className="mr-1" /> : <Volume2 size={12} className="mr-1" />}
                {isMuted ? 'Mudo' : 'Som'}
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center cursor-pointer group/media bg-gradient-to-b from-zinc-900/30 to-black/80"
          >
            {/* Thumbnail simulator pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Play Button Glow Container */}
            <div className="relative z-10 w-16 h-16 rounded-full bg-zinc-950/80 border border-zinc-800 flex items-center justify-center group-hover/media:border-red-500 group-hover/media:scale-110 shadow-2xl transition-all duration-300">
              <Play size={20} className="text-zinc-400 group-hover/media:text-red-500 fill-zinc-400/10 group-hover/media:fill-red-500/20 translate-x-0.5 transition-colors" />
              <div className="absolute inset-0 rounded-full border border-red-500/0 group-hover/media:border-red-500/30 group-hover/media:animate-ping opacity-75"></div>
            </div>
            
            <span className="relative z-10 text-[9px] text-zinc-400 font-black uppercase tracking-widest mt-4 group-hover/media:text-white transition-colors">
              Reproduzir Criativo
            </span>
            <span className="relative z-10 text-[8px] text-zinc-600 uppercase tracking-widest mt-1">
              {ad.category}
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
