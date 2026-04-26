"use client";

import React, { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronLeft, TrendingUp, Dumbbell, Activity, Calendar } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getExerciseAnalysis } from "@/lib/actions/treinoActions";

export default function ExerciseAnalysisPage() {
  const params = useParams();
  const [exerciseInfo, setExerciseInfo] = useState<{name: string, muscle_group: string} | null>(null);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const id = Number(params.exerciseId);
      if (isNaN(id)) return;
      const res = await getExerciseAnalysis(id);
      if (res.info) setExerciseInfo(res.info as any);
      
      const mapped = res.evolution.map((e: any) => {
        const d = new Date(e.date_completed);
        const dayStr = `${d.getDate()} ${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}`;
        return {
          date: dayStr,
          weight: Number(e.max_weight),
          avg_weight: Number(e.avg_weight),
          volumeLoad: Number(e.session_volume),
          reps: "Misto"
        };
      });
      setEvolutionData(mapped);
    }
    load();
  }, [params.exerciseId]);

  const averageWeight = evolutionData.length > 0 ? Math.round(
    evolutionData.reduce((acc, curr) => acc + curr.weight, 0) / evolutionData.length
  ) : 0;
  
  const maxWeight = evolutionData.length > 0 ? Math.max(...evolutionData.map(d => d.weight)) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 font-sans">
      
      {/* Top Navigation */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex items-center shadow-md z-10 sticky top-0">
        <Link href="/treino" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition active:scale-95">
          <ChevronLeft className="w-6 h-6 text-zinc-400" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-white ml-2">
          Análise de Desempenho
        </h1>
      </div>

      {/* Header Info */}
      <div className="px-4 py-8">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-500/20">
          <Dumbbell className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400">{exerciseInfo?.muscle_group || "Geral"}</span>
        </div>
        <h2 className="text-4xl font-extrabold text-white mb-2">{exerciseInfo?.name || "Carregando..."}</h2>
        <p className="text-zinc-400 text-sm">Acompanhe seu progresso detalhado de carga e repetições ao longo das semanas.</p>
      </div>

      {/* Overview Cards */}
      <div className="px-4 grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-zinc-500 mb-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase">Carga Média</span>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {averageWeight} <span className="text-base font-medium text-zinc-500">kg</span>
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-zinc-500 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase">Carga Máxima</span>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {maxWeight} <span className="text-base font-medium text-emerald-500">kg</span>
          </p>
        </div>
      </div>

      {/* Evolution Chart Area */}
      <div className="px-4 space-y-6">
        <div>
          <h3 className="text-lg font-bold flex items-center space-x-2 text-zinc-100 mb-4">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <span>Evolução de Carga (kg)</span>
          </h3>
          
          <div className="bg-zinc-900 p-4 pt-6 rounded-2xl border border-zinc-800 shadow-sm">
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={evolutionData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#71717A" }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#71717A" }} 
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181B", borderRadius: "12px", border: "1px solid #27272a", color: "#F4F4F5" }}
                    labelStyle={{ color: "#A1A1AA", marginBottom: "4px" }}
                    formatter={(value: any) => [`${value} kg`, "Carga Máxima"]}
                  />
                  
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#10B981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorWeight)" 
                    activeDot={{ r: 6, fill: "#10B981", stroke: "#18181B", strokeWidth: 2 }}
                    dot={{ r: 4, fill: "#18181B", stroke: "#10B981", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Volume Load Chart Area */}
        <div className="pt-2">
          <h3 className="text-lg font-bold flex items-center space-x-2 text-zinc-100 mb-4">
            <Activity className="w-5 h-5 text-emerald-500" />
            <span>Volume Load Diário</span>
          </h3>
          
          <div className="bg-zinc-900 p-4 pt-6 rounded-2xl border border-zinc-800 shadow-sm">
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={evolutionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#71717A" }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#71717A" }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181B", borderRadius: "12px", border: "1px solid #27272a", color: "#F4F4F5" }}
                    labelStyle={{ color: "#A1A1AA", marginBottom: "4px" }}
                    formatter={(value: any) => [`${value}`, "Volume Total"]}
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                  />
                  <Bar 
                    dataKey="volumeLoad" 
                    fill="#0EA5E9" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed History List */}
        <div className="pt-4">
          <h3 className="text-lg font-bold flex items-center space-x-2 text-zinc-100 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>Últimos Registros</span>
          </h3>

          <div className="space-y-3">
            {[...evolutionData].reverse().slice(0, 5).map((log, index) => (
              <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-zinc-300">{log.date}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-zinc-500 uppercase font-bold">Reps</span>
                    <span className="text-lg font-bold text-zinc-100">{log.reps}</span>
                  </div>
                  <div className="w-px h-8 bg-zinc-800" />
                  <div className="flex flex-col items-end w-12">
                    <span className="text-xs text-zinc-500 uppercase font-bold">Carga</span>
                    <span className="text-lg font-bold text-emerald-400">{log.weight}<span className="text-xs text-zinc-500 ml-0.5">kg</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
