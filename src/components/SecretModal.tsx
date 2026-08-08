import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, RefreshCw } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SecretModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Agente {
  id: string;
  email?: string;
  ativo?: boolean;
  origem?: string;
  ultimo_acesso?: any;
  ultimoAcesso?: any;
  lastActive?: any;
}

export const SecretModal: React.FC<SecretModalProps> = ({ isOpen, onClose }) => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAgentes = async () => {
    setIsLoading(true);
    setError('');
    try {
      const querySnapshot = await getDocs(collection(db, 'agentes'));
      const list: Agente[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          email: data.email || doc.id,
          ativo: typeof data.ativo === 'boolean' ? data.ativo : true,
          origem: data.origem || 'Desconhecido',
          ultimo_acesso: data.ultimo_acesso || data.ultimoAcesso || data.lastActive || null,
          ...data
        });
      });
      setAgentes(list);
    } catch (err) {
      console.error("Error fetching agents for secret modal:", err);
      setError('Falha na autenticação tática de leitura.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAgentes();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatLastActive = (val: any) => {
    if (!val) return 'Não registrado';
    if (val && typeof val.toDate === 'function') {
      return val.toDate().toLocaleString('pt-BR');
    }
    if (val && typeof val === 'object' && val.seconds) {
      return new Date(val.seconds * 1000).toLocaleString('pt-BR');
    }
    if (val instanceof Date) {
      return val.toLocaleString('pt-BR');
    }
    if (typeof val === 'number') {
      return new Date(val).toLocaleString('pt-BR');
    }
    return String(val);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-50 animate-in fade-in duration-300 font-sans">
      <div className="w-full max-w-4xl bg-[#080808] border-2 border-[#D4AF37]/35 rounded-2xl p-6 md:p-8 relative shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden">
        {/* Glow Lines */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] opacity-[0.02] [background-size:16px_16px] pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#D4AF37]/10 p-2.5 rounded-lg text-[#D4AF37] border border-[#D4AF37]/20">
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-widest text-white uppercase italic">
                Painel Secreto <span className="text-[#D4AF37]">007 Admin</span>
              </h3>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                Controle tático de depuração e status de credenciais
              </p>
            </div>
          </div>

          <button
            onClick={fetchAgentes}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] border border-white/5 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-[#D4AF37] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-[10px] font-black uppercase tracking-wider text-center mb-4">
            {error}
          </div>
        )}

        {/* Table Content */}
        <div className="bg-[#040404] border border-white/5 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
          {isLoading && agentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest animate-pulse">
                Carregando banco de agentes...
              </p>
            </div>
          ) : agentes.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs uppercase font-bold tracking-widest">
              Nenhum agente localizado.
            </div>
          ) : (
            <div className="min-w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0a0a0a] text-[9px] font-black uppercase tracking-widest text-zinc-500">
                    <th className="py-3 px-5">E-mail</th>
                    <th className="py-3 px-5 text-center">Status</th>
                    <th className="py-3 px-5">Origem</th>
                    <th className="py-3 px-5">Último Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02] text-xs font-semibold text-zinc-300">
                  {agentes.map((agente) => (
                    <tr key={agente.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 px-5 font-mono text-zinc-100 break-all">
                        {agente.email || agente.id}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {agente.ativo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black tracking-widest uppercase">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-black tracking-widest uppercase">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-[10px] text-zinc-400 uppercase tracking-wider">
                        {agente.origem}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[9px] text-zinc-400">
                        {formatLastActive(agente.ultimo_acesso)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center">
          <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
            Acesso Restrito - Todas as visualizações são auditadas pelo protocolo de segurança.
          </p>
        </div>
      </div>
    </div>
  );
};
