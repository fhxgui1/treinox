"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, Search, Dumbbell, ChevronRight } from "lucide-react";
import Link from "next/link";

import { getExerciseCatalog } from "@/lib/actions/treinoActions";

interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
}

export default function ExerciciosList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getExerciseCatalog();
      setDbExercises(data as any);
      setLoading(false);
    }
    load();
  }, []);

  const filteredExercises = dbExercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ex.muscle_group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-8 font-sans">
      
      {/* Top Navigation */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex flex-col z-10 sticky top-0 shadow-md">
        <div className="flex items-center mb-4">
          <Link href="/treino" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition active:scale-95">
            <ChevronLeft className="w-6 h-6 text-zinc-400" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white ml-2">
            Análise de Exercício
          </h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-xl leading-5 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition"
            placeholder="Buscar exercício ou grupo muscular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Exercises List */}
      <div className="px-4 mt-6 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse">Carregando catálogo de exercícios...</div>
        ) : filteredExercises.length > 0 ? (
          filteredExercises.map((exercise) => (
            <Link 
              key={exercise.id} 
              href={`/treino/exercicio/${exercise.id}`}
              className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center hover:bg-zinc-800 hover:border-zinc-700 transition active:scale-[0.98]"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-500/10 p-3 rounded-lg flex-shrink-0">
                  <Dumbbell className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white mb-0.5">{exercise.name}</span>
                  <span className="text-xs font-semibold uppercase text-zinc-500">{exercise.muscle_group}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </Link>
          ))
        ) : (
          <div className="text-center py-12">
            <Dumbbell className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-500">Nenhum exercício encontrado na base de dados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
