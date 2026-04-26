"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, TrendingUp, Activity, Dumbbell, ArrowUp, ArrowDown, Minus } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getTreinosAnalysis } from "@/lib/actions/treinoActions";

export default function ResumoTreinosPage() {
  const [period, setPeriod] = useState<"mensal" | "anual">("mensal");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ chart: any[], exercises: any[] }>({ chart: [], exercises: [] });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getTreinosAnalysis(period);
      setData(res);
      setLoading(false);
    }
    load();
  }, [period]);

  const totalVolume = data.chart.reduce((acc, curr) => acc + curr.volume, 0);
  const totalVolumeStr = totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : `${totalVolume}`;

  const renderDelta = (value: number, unit: string) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-emerald-500 font-bold">
          <ArrowUp className="w-3 h-3 mr-0.5" />
          {value}{unit}
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-rose-500 font-bold">
          <ArrowDown className="w-3 h-3 mr-0.5" />
          {Math.abs(value)}{unit}
        </div>
      );
    }
    return (
      <div className="flex items-center text-zinc-500 font-bold">
        <Minus className="w-3 h-3 mr-0.5" />
        0{unit}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 font-sans">
      
      {/* Top Navigation */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex flex-col shadow-md z-10 sticky top-0">
        <div className="flex items-center mb-4">
          <Link href="/treino" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition active:scale-95">
            <ChevronLeft className="w-6 h-6 text-zinc-400" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white ml-2">
            Análise de Treinos
          </h1>
        </div>

        {/* Toggle Mensal / Anual */}
        <div className="bg-zinc-950 p-1 rounded-lg inline-flex border border-zinc-800 self-start">
          <button
            onClick={() => setPeriod("mensal")}
            className={`px-6 py-1.5 text-sm font-medium rounded-md transition ${
              period === "mensal"
                ? "bg-zinc-800 text-emerald-400 shadow-md"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod("anual")}
            className={`px-6 py-1.5 text-sm font-medium rounded-md transition ${
              period === "anual"
                ? "bg-zinc-800 text-emerald-400 shadow-md"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {/* Main Dashboard Area */}
      <div className="px-4 py-6">
        {loading ? (
           <div className="text-center py-20 text-zinc-500 animate-pulse">Carregando processamento de treinos reais...</div>
        ) : (
          <>
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm mb-8">
              <div className="flex items-center space-x-2 text-zinc-500 mb-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold uppercase tracking-wider">Volume Load Global</span>
              </div>
              <div className="flex items-baseline mb-6">
                <h2 className="text-5xl font-extrabold text-white tracking-tighter">
                  {totalVolumeStr}
                </h2>
                <span className="text-zinc-500 ml-2 font-medium">kg acumulados no período</span>
              </div>

              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.chart}
                margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorGlobalVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
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
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#18181B", borderRadius: "12px", border: "1px solid #27272a", color: "#F4F4F5" }}
                  formatter={(value: any) => [`${value} kg`, "Volume"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#0EA5E9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorGlobalVolume)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exercises Evolution List */}
        <div>
          <h3 className="text-lg font-bold flex items-center space-x-2 text-zinc-100 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>Evolução por Exercício ({period})</span>
          </h3>

          <div className="space-y-4">
            {data.exercises.length === 0 ? (
               <div className="text-center py-8 text-zinc-600">Nenhum volume treinado nestes limites.</div>
            ) : data.exercises.map((exercise) => (
              <Link 
                key={exercise.id} 
                href={`/treino/exercicio/${exercise.id}`}
                className="block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition active:scale-[0.98] shadow-sm"
              >
                {/* Header (Músculo + Nome) */}
                <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex items-center space-x-3">
                  <div className="bg-emerald-500/10 p-2.5 rounded-xl flex-shrink-0">
                    <Dumbbell className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-white text-lg leading-tight">{exercise.name}</span>
                    <span className="text-xs font-semibold uppercase text-zinc-500">{exercise.muscleGroup}</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 divide-x divide-zinc-800 p-4 bg-zinc-950/30">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Carga</span>
                    {renderDelta(exercise.cargaDelta, "kg")}
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Reps</span>
                    {renderDelta(exercise.repDelta, "")}
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Vol. Load</span>
                    {renderDelta(exercise.volumeDelta, "kg")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
          </>
        )}

      </div>
    </div>
  );
}
