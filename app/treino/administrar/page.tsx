"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, Key, Settings2, Plus, Edit2, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getPrograms, toggleProgramActive, deleteProgram } from "@/lib/actions/treinoActions";

interface TrainingProgram {
  id: number;
  name: string;
  focus: string;
  sessions_count: number;
  is_active: boolean;
}

export default function AdministrarTreinosPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrograms = async () => {
    setLoading(true);
    const data = await getPrograms();
    setPrograms(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);


  const handleToggle = async (id: number, currentActive: boolean) => {
    await toggleProgramActive(id, !currentActive);
    await fetchPrograms();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja apagar esta ficha de treino completamente?")) {
      await deleteProgram(id);
      await fetchPrograms();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 font-sans">
      
      {/* Top Navigation */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex flex-col shadow-md z-10 sticky top-0">
        <div className="flex items-center mb-4">
          <Link href="/treino" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition active:scale-95">
            <ChevronLeft className="w-6 h-6 text-zinc-400" />
          </Link>
          <div className="flex items-center space-x-2 ml-2">
            <Settings2 className="w-5 h-5 text-emerald-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Administrar Treinos
            </h1>
          </div>
        </div>
        <p className="text-zinc-400 text-sm">
          Gerencie suas fichas de treino. A ficha ativa selecionada ditará o andamento dos exercícios no aplicativo.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="px-4 mt-6 space-y-4">
        
        {loading ? (
          <div className="text-center py-10 text-zinc-500">Caregando fichas...</div>
        ) : programs.length === 0 ? (
          <div className="text-center py-10 text-zinc-500">Nenhuma ficha encontrada. Crie a sua primeira!</div>
        ) : programs.map((program) => {
          const isActive = program.is_active;
          
          return (
            <div 
              key={program.id} 
              className={`relative rounded-2xl border p-5 transition-all duration-300 ${
                isActive 
                  ? "bg-emerald-900/10 border-emerald-500/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)]" 
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 shadow-sm"
              }`}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute top-4 right-4 flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Ficha Ativa</span>
                </div>
              )}

              <div className="pr-24">
                <h2 className="text-xl font-extrabold text-white mb-1">{program.name}</h2>
                <p className="text-zinc-400 text-sm mb-3">Foco: {program.focus}</p>
                
                <div className="inline-flex items-center bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-300">
                    {program.sessions_count} Seções (Ex: A, B, C...)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-between items-center gap-2 flex-wrap">
                
                {/* Select / Active Toggle Button */}
                {isActive ? (
                  <button 
                    onClick={() => handleToggle(program.id, true)}
                    className="flex-1 flex justify-center items-center py-2.5 rounded-xl font-bold text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 active:scale-95 transition"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Ligada
                  </button>
                ) : (
                  <button 
                    onClick={() => handleToggle(program.id, false)}
                    className="flex-1 flex justify-center items-center py-2.5 rounded-xl font-bold text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition active:scale-95 border border-transparent"
                  >
                    <Play className="w-4 h-4 mr-1.5" />
                    Desligada
                  </button>
                )}

                {/* Edit & Delete Group */}
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <Link href={`/treino/administrar/${program.id}`} className="flex-1 sm:flex-none flex justify-center items-center px-4 py-2.5 rounded-xl font-bold text-sm bg-zinc-950/50 text-emerald-400 hover:bg-emerald-500/10 transition border border-emerald-500/20 shadow-sm shadow-emerald-900/10 active:scale-95">
                    <Edit2 className="w-4 h-4 mr-1.5" />
                    Editar
                  </Link>

                  <button 
                    onClick={() => handleDelete(program.id)}
                    className="flex justify-center items-center px-4 py-2.5 rounded-xl font-bold text-sm bg-zinc-950/50 text-rose-500 hover:bg-rose-500/10 transition border border-rose-500/20 active:scale-95"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* Floating Action Button (Create New Program) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-40">
        <Link href="/treino/administrar/nova" className="w-full flex items-center justify-center py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-900/50 hover:bg-emerald-500 transition active:scale-95">
          <Plus className="w-6 h-6 mr-2" />
          Montar Nova Ficha
        </Link>
      </div>

    </div>
  );
}
