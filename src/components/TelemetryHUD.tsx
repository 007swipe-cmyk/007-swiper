import React, { useState, useEffect } from 'react';

export const TelemetryHUD: React.FC = () => {
  const [time, setTime] = useState<string>('');
  const [usdRate, setUsdRate] = useState<string>('USD R$ --.--');

  // 1. Digital Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hrs}:${mins}:${secs}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. USD Exchange Rate Fetching
  useEffect(() => {
    const fetchUsdRate = async () => {
      try {
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        if (response.ok) {
          const data = await response.json();
          const rate = data.USDBRL?.bid;
          if (rate) {
            const formatted = parseFloat(rate).toFixed(2);
            setUsdRate(`USD R$ ${formatted}`);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar cotação do dólar:', error);
        setUsdRate('USD R$ --.--');
      }
    };

    fetchUsdRate();
    // Refresh USD rate every 5 minutes
    const interval = setInterval(fetchUsdRate, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 sm:gap-6 font-mono text-[10px] text-zinc-400 select-none border-l border-white/5 pl-4 sm:pl-6 h-6">
      {/* Clock */}
      <span className="tracking-widest font-semibold text-zinc-500">{time}</span>

      {/* Dólar */}
      <span className="tracking-wide font-semibold text-[#D4AF37]/80">{usdRate}</span>

      {/* System Status indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black text-zinc-500 tracking-wider">SYS: ONLINE</span>
        <div className="relative w-1.5 h-1.5 flex items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
        </div>
      </div>
    </div>
  );
};
