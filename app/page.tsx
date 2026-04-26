"use client";

import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChevronRight, Dumbbell, Calendar, TrendingUp, Menu, X, BarChart2, Settings, Plus } from "lucide-react";
import Link from "next/link";
import { getActiveProgram, getDashboardVolumeData } from "@/lib/actions/treinoActions";

// --- Dynamic Data Handled Below ---

export default function TreinoDashboard() {
  const [timeView, setTimeView] = useState<"month" | "year">("month");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeProg, setActiveProg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getActiveProgram();
      setActiveProg(data);
      
      const logs = await getDashboardVolumeData(timeView);
      const aggregated: Record<string, number> = {};
      logs.forEach((log: any) => {
        const d = new Date(log.completed_at);
        const dayStr = timeView === "month" 
          ? `${d.getDate()} ${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}`
          : d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
          
        aggregated[dayStr] = (aggregated[dayStr] || 0) + Number(log.total_volume_load);
      });
      const finalGraph = Object.keys(aggregated).map(k => ({ name: k, volume: aggregated[k] }));
      setChartData(finalGraph);
      
      setLoading(false);
    }
    load();
  }, [timeView]);

  const nextSession = activeProg?.sessions?.[activeProg.current_session_index] || null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 font-sans">
      {/* Top Navigation Bar / Current Sequence */}
      <div className="bg-zinc-900 border-b border-emerald-500/10 px-4 py-6 rounded-b-3xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              Olá, Atleta
            </h1>
            <p className="text-zinc-400 text-sm">Acompanhe sua evolução e prepare-se.</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition active:scale-95"
          >
            <Menu className="w-6 h-6 text-zinc-300" />
          </button>
        </div>

        {/* Current Training Widget */}
        {loading ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center text-zinc-500 animate-pulse">
            Carregando sua rotina...
          </div>
        ) : !activeProg ? (
          <Link href="/treino/administrar" className="block">
            <div className="bg-zinc-900 border border-dashed border-zinc-700 hover:border-emerald-500 hover:bg-zinc-900 transition rounded-2xl p-6 text-center text-zinc-400">
              <Dumbbell className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <h2 className="text-lg font-bold text-white mb-1">Nenhuma Ficha Ativa</h2>
              <p className="text-sm mb-4">Você ainda não selecionou qual ficha de treino irá seguir no aplicativo hoje.</p>
              <div className="inline-flex items-center text-emerald-500 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl">
                <Settings className="w-4 h-4 mr-2" />
                Configurar Ficha
              </div>
            </div>
          </Link>
        ) : (
          <Link href={`/treino/${nextSession?.id || 0}`} className="block">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-2xl p-5 shadow-lg shadow-emerald-900/50 text-white transform transition active:scale-[0.98]">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
                  <Dumbbell className="w-3 h-3 text-emerald-300" />
                  <span className="text-emerald-50">Próximo Treino</span>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-200" />
              </div>
              
              <h2 className="text-3xl font-extrabold mb-1">{nextSession?.name || "Treino"}</h2>
              <p className="text-emerald-200 font-medium">{activeProg.name} • {activeProg.focus}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Main Content Area */}
      <div className="px-4 mt-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold flex items-center space-x-2 text-zinc-100">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>Volume Total (Carga x Reps)</span>
          </h3>
          <p className="text-sm text-zinc-400 mt-1 mb-4">
            Acompanhe o crescimento da sua carga em cada sessão de treino.
          </p>

          <div className="bg-zinc-900 p-1 rounded-lg inline-flex mb-4 border border-zinc-800">
            <button
              onClick={() => setTimeView("month")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                timeView === "month"
                  ? "bg-zinc-800 text-emerald-400 shadow-md"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setTimeView("year")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                timeView === "year"
                  ? "bg-zinc-800 text-emerald-400 shadow-md"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Este Ano
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Visão de {timeView === "month" ? "Mês" : "Ano"}</span>
            </div>
          </div>
          
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#71717A" }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#71717A" }} 
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#18181B", borderRadius: "12px", border: "1px solid #27272a", color: "#F4F4F5" }}
                  formatter={(value: any) => [`${value} kg`, 'Carga Movimentada']}
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: "12px", paddingTop: "20px", color: "#A1A1AA" }} 
                />
                
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  name="Volume Total do Dia" 
                  stroke="#10B981" 
                  strokeWidth={4} 
                  dot={{ r: 4, strokeWidth: 2, fill: "#18181b", stroke: "#10B981" }} 
                  activeDot={{ r: 6, fill: "#10B981" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Sidebar Drawer */}
          <div className="relative w-72 max-w-[80%] h-full bg-zinc-950 border-r border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-zinc-900 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-500" />
                Menu
              </h2>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-zinc-500 hover:text-zinc-300 transition rounded-full hover:bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 flex flex-col space-y-2">
              <Link 
                href="/treino/analise"
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-zinc-900 transition active:scale-95 text-zinc-300 hover:text-white border border-transparent hover:border-zinc-800"
              >
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <BarChart2 className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-semibold">Lista de Exercícios</span>
              </Link>
              
              <Link 
                href="/treino/analise-treinos"
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-zinc-900 transition active:scale-95 text-zinc-300 hover:text-white border border-transparent hover:border-zinc-800"
              >
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-semibold">Análise de Treinos</span>
              </Link>
              
              <Link 
                href="/treino/administrar"
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-zinc-900 transition active:scale-95 text-zinc-300 hover:text-white border border-transparent hover:border-zinc-800"
              >
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <Settings className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-semibold">Administrar Treino</span>
              </Link>
              
              <Link 
                href="/treino/cadastros"
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-zinc-900 transition active:scale-95 text-zinc-300 hover:text-white border border-transparent hover:border-zinc-800"
              >
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <Plus className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-semibold">Cadastros</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
