"use client";

import React, { useState, useEffect } from "react";
import { Users, UserPlus, Check, X, Search, UserCheck } from "lucide-react";
import { 
  getActivePartners, 
  getPendingRequests, 
  searchUsers, 
  sendPartnerRequest, 
  acceptPartnerRequest, 
  declinePartnerRequest 
} from "@/lib/actions/partnerActions";

export default function PartnerManager({ 
  selectedPartnerId, 
  onSelectPartner 
}: { 
  selectedPartnerId: string, 
  onSelectPartner: (id: string) => void 
}) {
  const [activePartners, setActivePartners] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    try {
      const active = await getActivePartners();
      setActivePartners(active);
      const pending = await getPendingRequests();
      setPendingRequests(pending);
      
      // Select first partner automatically if none selected
      if (active.length > 0 && !selectedPartnerId) {
        onSelectPartner(active[0].user_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await searchUsers(searchTerm);
      setSearchResults(res);
      if (res.length === 0) setMsg("Nenhum usuário encontrado.");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (id: string) => {
    try {
      await sendPartnerRequest(id);
      setMsg("Solicitação enviada!");
      setSearchResults([]);
      setSearchTerm("");
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  const handleAccept = async (reqId: number) => {
    await acceptPartnerRequest(reqId);
    loadData();
  };

  const handleDecline = async (reqId: number) => {
    await declinePartnerRequest(reqId);
    loadData();
  };

  return (
    <div className="mt-6 border-t border-zinc-800 pt-4">
      <h3 className="text-zinc-500 text-xs font-bold uppercase mb-4 pl-2 flex items-center gap-2">
        <Users className="w-4 h-4" /> Gereciar Parceiros
      </h3>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-4">
          <span className="text-emerald-500 text-[10px] font-bold uppercase pl-2">Convites Pendentes</span>
          <div className="mt-2 space-y-2">
            {pendingRequests.map(req => (
              <div key={req.request_id} className="bg-zinc-900 border border-emerald-900/50 p-3 rounded-xl flex justify-between items-center text-sm">
                <div>
                  <div className="text-zinc-200 font-bold">{req.name}</div>
                  <div className="text-zinc-500 text-xs">{req.email}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDecline(req.request_id)} className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg"><X className="w-4 h-4"/></button>
                  <button onClick={() => handleAccept(req.request_id)} className="p-1.5 bg-emerald-600 text-white rounded-lg"><Check className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Partners Selection */}
      <div className="mb-4">
        <span className="text-zinc-500 text-[10px] font-bold uppercase pl-2">Seus Parceiros</span>
        {activePartners.length === 0 ? (
           <p className="text-zinc-600 pl-2 text-sm mt-1 mb-2">Nenhum parceiro adicionado.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {activePartners.map(p => (
              <button 
                key={p.user_id}
                onClick={() => onSelectPartner(p.user_id)}
                className={`w-full text-left p-3 rounded-xl flex justify-between items-center transition ${
                  selectedPartnerId === p.user_id 
                    ? "bg-emerald-600/20 border border-emerald-500/50" 
                    : "bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900"
                }`}
              >
                <div>
                  <div className={`font-bold ${selectedPartnerId === p.user_id ? 'text-emerald-400' : 'text-zinc-300'}`}>{p.name}</div>
                  <div className="text-zinc-500 text-xs">{p.email}</div>
                </div>
                {selectedPartnerId === p.user_id && <UserCheck className="w-4 h-4 text-emerald-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add New Partner */}
      <div className="mt-4">
        <span className="text-zinc-500 text-[10px] font-bold uppercase pl-2">Adicionar</span>
        <form onSubmit={handleSearch} className="mt-2 flex gap-2">
          <input 
            type="text" 
            placeholder="Buscar por email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-zinc-900 text-sm text-zinc-100 placeholder-zinc-500 px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 border border-zinc-800" 
          />
          <button type="submit" className="bg-zinc-800 text-zinc-300 p-2 rounded-xl hover:bg-zinc-700 transition">
            <Search className="w-4 h-4" />
          </button>
        </form>
        
        {loading && <p className="text-xs text-zinc-500 mt-2 pl-2">Buscando...</p>}
        {msg && <p className="text-xs text-emerald-500/80 mt-2 pl-2">{msg}</p>}

        {searchResults.length > 0 && (
          <div className="mt-2 space-y-2">
             {searchResults.map(u => (
               <div key={u.id} className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl flex justify-between items-center text-sm">
                 <div>
                   <div className="text-zinc-300 font-semibold">{u.name}</div>
                   <div className="text-zinc-500 text-xs">{u.email}</div>
                 </div>
                 <button onClick={() => handleSendRequest(u.id)} className="p-1.5 bg-emerald-600/20 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition">
                   <UserPlus className="w-4 h-4"/>
                 </button>
               </div>
             ))}
          </div>
        )}
      </div>

    </div>
  );
}
