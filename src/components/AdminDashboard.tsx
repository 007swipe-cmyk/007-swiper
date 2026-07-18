import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldCheck, Users, ArrowLeft } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

interface Agente {
  id: string;
  email?: string;
  ativo?: boolean;
  lastActive?: any;
  ultimoAcesso?: any;
  lastActiveDate?: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const agentesRef = collection(db, 'agentes');
    
    // Set up real-time subscription using onSnapshot
    const unsubscribe = onSnapshot(agentesRef, (snapshot) => {
      const list: Agente[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          email: data.email || doc.id,
          ativo: typeof data.ativo === 'boolean' ? data.ativo : true, // Default to true if not present
          lastActive: data.lastActive || data.ultimoAcesso || data.lastActiveDate || null,
          ...data
        });
      });
      setAgentes(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (id: string, currentAtivo: boolean) => {
    try {
      const docRef = doc(db, 'agentes', id);
      await updateDoc(docRef, {
        ativo: !currentAtivo
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Falha ao atualizar o status do agente.");
    }
  };

  const formatLastActive = (val: any) => {
    if (!val) return 'Não registrado';
    
    // Check if Firestore Timestamp
    if (val && typeof val.toDate === 'function') {
      return val.toDate().toLocaleString('pt-BR');
    }
    // Check if seconds property exists (often raw JSON timestamp)
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

  // Calculations for KPI Cards
  const totalAgentes = agentes.length;
  const ativosCount = agentes.filter(a => a.ativo).length;
  const suspensosCount = agentes.filter(a => !a.ativo).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans max-w-6xl mx-auto pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-3 font-sans">
            <ShieldCheck className="text-[#D4AF37]" size={18} /> 
            PAINEL DE DEPURAÇÃO OPERACIONAL (ADMIN)
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase font-semibold tracking-wider font-sans">
            Gerenciamento em tempo real de acessos e credenciamento de agentes.
          </p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#121212] hover:bg-white hover:text-black border border-white/10 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer w-fit"
        >
          <ArrowLeft size={12} /> VOLTAR AO PAINEL
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#D4AF37]/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#D4AF37]/2 rounded-bl-full pointer-events-none"></div>
          <div className="space-y-1">
            <span className="text-[9px] text-[#D4AF37] font-black tracking-widest uppercase">TOTAL DE AGENTES</span>
            <div className="text-3xl font-black text-white font-mono mt-2">{totalAgentes}</div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/2 rounded-bl-full pointer-events-none"></div>
          <div className="space-y-1">
            <span className="text-[9px] text-emerald-400 font-black tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              AGENTES ATIVOS
            </span>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-2">{ativosCount}</div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/2 rounded-bl-full pointer-events-none"></div>
          <div className="space-y-1">
            <span className="text-[9px] text-red-400 font-black tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              AGENTES SUSPENSOS
            </span>
            <div className="text-3xl font-black text-red-500 font-mono mt-2">{suspensosCount}</div>
          </div>
        </div>
      </div>

      {/* AGENTS LIST TABLE */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/1 rounded-full blur-3xl pointer-events-none"></div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-20">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest animate-pulse">
              Carregando agentes do Firestore...
            </p>
          </div>
        ) : agentes.length === 0 ? (
          <div className="text-center py-20">
            <Users size={32} className="mx-auto text-zinc-600 mb-4 opacity-50" />
            <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest">
              Nenhum agente cadastrado no sistema.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#050505] text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  <th className="py-4 px-6 font-mono">ID / Email do Agente</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6">Último Acesso</th>
                  <th className="py-4 px-6 text-center">Ações Operacionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] text-xs font-medium text-zinc-300">
                {agentes.map((agente) => (
                  <tr 
                    key={agente.id} 
                    className="hover:bg-white/[0.01] transition-colors"
                  >
                    {/* User ID/Email */}
                    <td className="py-4 px-6 font-mono text-zinc-100 break-all max-w-xs">
                      {agente.email || agente.id}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 text-center">
                      {agente.ativo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black tracking-widest uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          ATIVO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black tracking-widest uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          SUSPENSO
                        </span>
                      )}
                    </td>

                    {/* Last Active Date */}
                    <td className="py-4 px-6 font-mono text-[10px] text-zinc-400">
                      {formatLastActive(agente.lastActive)}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-6 text-center">
                      {agente.ativo ? (
                        <button
                          onClick={() => handleToggleStatus(agente.id, true)}
                          className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black border border-red-500/20 hover:border-transparent px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-95 shadow-[0_2px_10px_rgba(239,68,68,0.05)]"
                        >
                          SUSPENDER
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(agente.id, false)}
                          className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 hover:border-transparent px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-95 shadow-[0_2px_10px_rgba(16,185,129,0.05)]"
                        >
                          REATIVAR
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
