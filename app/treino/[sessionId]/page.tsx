"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { ChevronLeft, ChevronRight, Check, Play, Square, RotateCcw, X, Home, CheckSquare, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getSessionDetails, saveWorkoutLog } from "@/lib/actions/treinoActions";

// --- Mock Data ---
interface ExerciseSet {
  id: string;
  name: string;
  reps: number;
  weight: number;
  partner_reps?: number;
  partner_weight?: number;
  completed: boolean;
}

interface Exercise {
  id: string;
  catalog_id: number;
  name: string;
  sets: ExerciseSet[];
}

function ExerciseExecutionContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isDuo = searchParams?.get("duo") === "true";

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentExIndex, setCurrentExIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const sessionId = Number(params.sessionId);
        if (isNaN(sessionId)) return;

        const data = await getSessionDetails(sessionId);
        if (data && data.exercises) {
          const mapped = data.exercises.map((ex: any) => {
            const setsArray = [];
            for (let i = 0; i < ex.sets; i++) {
              setsArray.push({
                id: `s_${ex.program_exercise_id}_${i}`,
                name: `${i + 1}ª Série`,
                reps: ex.target_reps,
                weight: 0,
                partner_reps: ex.target_reps,
                partner_weight: 0,
                completed: false,
              });
            }
            return {
              id: String(ex.program_exercise_id),
              catalog_id: ex.catalog_id,
              name: ex.name,
              sets: setsArray,
            };
          });
          setExercises(mapped);
          setSessionData(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.sessionId]);

  // Stopwatch state
  const [time, setTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal State for modifying/confirming Sets
  const [selectedSet, setSelectedSet] = useState<{ exerciseIndex: number; setIndex: number } | null>(null);
  const [confirmReps, setConfirmReps] = useState<number | string>("");
  const [confirmWeight, setConfirmWeight] = useState<number | string>("");
  
  const [confirmReps2, setConfirmReps2] = useState<number | string>("");
  const [confirmWeight2, setConfirmWeight2] = useState<number | string>("");

  // Modal State for Finalizing Session
  const [showFinishSession, setShowFinishSession] = useState(false);

  const currentExercise = exercises[currentExIndex];
  const prevExercise = currentExIndex > 0 ? exercises[currentExIndex - 1] : null;
  const nextExercise = currentExIndex < exercises.length - 1 ? exercises[currentExIndex + 1] : null;

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = () => setTimerRunning(true);
  const stopTimer = () => setTimerRunning(false);
  const resetTimer = () => {
    setTimerRunning(false);
    setTime(0);
  };

  const handleOpenConfirm = (exerciseIndex: number, setIndex: number) => {
    const setToComplete = exercises[exerciseIndex].sets[setIndex];
    if (setToComplete.completed) return;
    
    setConfirmReps(setToComplete.reps);
    setConfirmWeight(setToComplete.weight);
    setConfirmReps2(setToComplete.partner_reps || setToComplete.reps);
    setConfirmWeight2(setToComplete.partner_weight || setToComplete.weight);

    setSelectedSet({ exerciseIndex, setIndex });
  };

  const handleConfirmSet = () => {
    if (!selectedSet) return;
    const { exerciseIndex, setIndex } = selectedSet;
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex] = {
      ...newExercises[exerciseIndex].sets[setIndex],
      completed: true,
      reps: Number(confirmReps),
      weight: Number(confirmWeight),
      partner_reps: isDuo ? Number(confirmReps2) : undefined,
      partner_weight: isDuo ? Number(confirmWeight2) : undefined,
    };
    setExercises(newExercises);
    setSelectedSet(null);
    resetTimer();
    startTimer();
  };

  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinalizeSession = async () => {
    if (!sessionData) return;
    setIsFinishing(true);
    try {
      const formattedHistory = exercises.map(ex => ({
        program_exercise_id: Number(ex.id),
        catalog_id: ex.catalog_id || 0,
        sets: ex.sets.map(s => ({ reps: s.reps, weight: s.weight }))
      }));

      const partnerHistory = isDuo ? exercises.map(ex => ({
        program_exercise_id: Number(ex.id),
        catalog_id: ex.catalog_id || 0,
        sets: ex.sets.map(s => ({ reps: s.partner_reps || 0, weight: s.partner_weight || 0 }))
      })) : undefined;

      await saveWorkoutLog(sessionData.program_id, sessionData.id, formattedHistory, partnerHistory);
      setShowFinishSession(false);
      router.push("/");
    } catch(err) {
      console.error(err);
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-8 flex flex-col font-sans">
      
      {/* Top Navigation - Previous / Next */}
      <div className="flex w-full bg-zinc-900 shadow-inner border-b border-zinc-800">
        <button
          onClick={() => setCurrentExIndex((prev) => Math.max(0, prev - 1))}
          disabled={!prevExercise}
          className="flex-1 py-3 px-2 flex items-center justify-center border-r border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed active:bg-zinc-800 transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-300 truncate max-w-[120px]">
            {prevExercise ? prevExercise.name : "Anterior"}
          </span>
        </button>
        <button
          onClick={() => setCurrentExIndex((prev) => Math.min(exercises.length - 1, prev + 1))}
          disabled={!nextExercise}
          className="flex-1 py-3 px-2 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:bg-zinc-800 transition"
        >
          <span className="text-sm font-semibold text-zinc-300 truncate max-w-[120px]">
            {nextExercise ? nextExercise.name : "Próximo"}
          </span>
          <ChevronRight className="w-4 h-4 ml-1 text-zinc-500" />
        </button>
      </div>

      {/* Current Exercise Title */}
      <div className="bg-zinc-900 py-4 text-center shadow-sm border-b border-emerald-500/20 px-4 min-h-[64px] flex items-center justify-center relative">
        {loading ? (
           <span className="text-zinc-500 animate-pulse text-sm">Carregando série...</span>
        ) : (
          <h2 className="text-xl font-bold tracking-tight text-white uppercase mt-1">
            {currentExercise?.name || "Sem título"}
            {isDuo && <span className="ml-2 text-xs bg-emerald-600 px-2 py-1 rounded-full text-white align-middle">DUO</span>}
          </h2>
        )}
      </div>

      {/* Sets List */}
      <div className="flex-1 px-4 mt-6 overflow-y-auto space-y-3 pb-56">
        {loading ? (
             <div className="text-center text-zinc-600 mt-10">Buscando do banco de dados...</div>
        ) : currentExercise?.sets?.length > 0 ? (
          currentExercise.sets.map((setInfo, idx) => (
          <div 
            key={setInfo.id} 
            className={`flex items-center justify-between p-4 rounded-xl border ${
              setInfo.completed 
                ? "bg-zinc-900 border-emerald-900" 
                : "bg-zinc-900 border-zinc-800 shadow-sm"
            }`}
          >
            <div className="flex flex-col">
              <span className={`text-sm font-bold ${setInfo.completed ? 'text-emerald-500' : 'text-zinc-200'}`}>
                {setInfo.name}
              </span>
              <div className="flex flex-col mt-1 gap-1">
                <span className="text-lg font-medium text-zinc-400 flex items-baseline">
                   {isDuo && <span className="text-xs text-zinc-500 w-12 inline-block">Você:</span>}
                   {setInfo.reps} <span className="text-xs mx-1 text-zinc-600">x</span> {setInfo.weight}kg
                </span>
                {isDuo && (
                  <span className="text-lg font-medium text-emerald-400/80 flex items-baseline">
                     <span className="text-xs text-emerald-500/50 w-12 inline-block">Parça:</span>
                     {setInfo.partner_reps} <span className="text-xs mx-1 text-emerald-600/50">x</span> {setInfo.partner_weight}kg
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => handleOpenConfirm(currentExIndex, idx)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
                setInfo.completed 
                  ? "bg-emerald-600/20 text-emerald-500 shadow-emerald-900/20" 
                  : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/50"
              }`}
            >
              {setInfo.completed ? <Check className="w-8 h-8" /> : ""}
            </button>
          </div>
        ))
        ) : (
           <div className="text-center text-zinc-600 mt-10">Nenhuma série configurada.</div>
        )}
      </div>

      {/* Footer Section (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 w-full p-5 bg-zinc-950/80 backdrop-blur-md z-40 border-t border-zinc-800 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.5)] flex gap-4">
        
        {/* Left Actions (Home & Confirm Combo) */}
        <div className="flex flex-col gap-2 justify-between">
          <Link href="/" className="flex items-center justify-center w-8 h-14 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition shadow-sm border border-zinc-800 active:scale-95 text-zinc-400">
            <Home className="w-6 h-6" />
          </Link>
          <button 
            onClick={() => setShowFinishSession(true)}
            className="flex items-center justify-center w-8 h-14 bg-emerald-600 rounded-2xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/50 text-white active:scale-95"
          >
            <CheckSquare className="w-6 h-6" />
          </button>
        </div>

        {/* Stopwatch Main Area */}
        <div className="bg-zinc-900 rounded-3xl p-5 shadow-lg border border-zinc-800 flex flex-col items-center flex-1 min-w-0">
          <div className="text-5xl font-mono font-bold tracking-tighter text-white mb-4 drop-shadow-sm">
            {formatTime(time)}
          </div>
          
          <div className="flex space-x-2 w-full justify-center">
            <button
              onClick={resetTimer}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-0 rounded-xl font-semibold border border-zinc-700 active:scale-95 transition flex justify-center items-center text-sm"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Zerar
            </button>
            
            {timerRunning ? (
              <button
                onClick={stopTimer}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-0 rounded-xl font-bold shadow-lg shadow-zinc-900/50 active:scale-95 transition flex justify-center items-center text-sm"
              >
                <Square className="w-4 h-4 mr-1 fill-current" />
                Parar
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="flex-1 text-emerald-400 outline-none font-bold py-0 rounded-xl border-2 border-emerald-500/50 hover:bg-emerald-500/10 hover:border-emerald-500 transition active:scale-95 flex justify-center items-center text-sm"
              >
                <Play className="w-4 h-4 mr-1 fill-current" />
                Iniciar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Individual Set */}
      {selectedSet !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-zinc-800 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setSelectedSet(null)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-center text-white mb-6 mt-2">
              Confirmar Série
            </h3>
            
            <div className="flex flex-col space-y-4 mb-8">
              
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 shadow-inner">
                 <h4 className="text-zinc-400 text-xs font-bold uppercase mb-4 text-center">Atleta 1 (Você)</h4>
                 <div className="flex space-x-4">
                    <div className="flex-1 flex flex-col items-center">
                      <label className="text-[10px] font-bold uppercase text-zinc-500 mb-2">Repetições</label>
                      <input 
                        type="number"
                        value={confirmReps}
                        onChange={(e) => setConfirmReps(e.target.value)}
                        className="w-full text-center text-2xl font-bold py-2 bg-zinc-900 text-white rounded-xl border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="flex flex-col justify-center pt-6">
                      <X className="w-3 h-3 text-zinc-600" />
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <label className="text-[10px] font-bold uppercase text-zinc-500 mb-2">Carga (kg)</label>
                      <input 
                        type="number"
                        value={confirmWeight}
                        onChange={(e) => setConfirmWeight(e.target.value)}
                        className="w-full text-center text-2xl font-bold py-2 bg-zinc-900 text-white rounded-xl border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                        inputMode="numeric"
                      />
                    </div>
                 </div>
              </div>

              {isDuo && (
                <div className="bg-zinc-950 p-4 rounded-2xl border border-emerald-900/50 shadow-inner">
                   <h4 className="text-emerald-400/80 text-xs font-bold uppercase mb-4 text-center">Atleta 2 (Parceiro)</h4>
                   <div className="flex space-x-4">
                      <div className="flex-1 flex flex-col items-center">
                        <label className="text-[10px] font-bold uppercase text-emerald-500/50 mb-2">Repetições</label>
                        <input 
                          type="number"
                          value={confirmReps2}
                          onChange={(e) => setConfirmReps2(e.target.value)}
                          className="w-full text-center text-2xl font-bold py-2 bg-zinc-900 text-emerald-100 rounded-xl border-none focus:ring-2 focus:ring-emerald-600 outline-none"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="flex flex-col justify-center pt-6">
                        <X className="w-3 h-3 text-emerald-900" />
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <label className="text-[10px] font-bold uppercase text-emerald-500/50 mb-2">Carga (kg)</label>
                        <input 
                          type="number"
                          value={confirmWeight2}
                          onChange={(e) => setConfirmWeight2(e.target.value)}
                          className="w-full text-center text-2xl font-bold py-2 bg-zinc-900 text-emerald-100 rounded-xl border-none focus:ring-2 focus:ring-emerald-600 outline-none"
                          inputMode="numeric"
                        />
                      </div>
                   </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleConfirmSet}
              className="w-full bg-emerald-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-emerald-900/50 active:scale-95 transition"
            >
              Salvar & Descansar
            </button>
          </div>
        </div>
      )}

      {/* Finish Session Confirmation Modal */}
      {showFinishSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-zinc-800">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-500/20 p-4 rounded-full">
                <Dumbbell className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-center text-white mb-2">
              Finalizar Treino?
            </h3>
            <p className="text-center text-zinc-400 mb-8">
              Você está prestes a concluir esta sessão de treinamento. O progresso será registrado no histórico.
            </p>
            
            <div className="flex gap-4">
               <button
                onClick={() => setShowFinishSession(false)}
                className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-4 rounded-xl active:scale-95 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleFinalizeSession}
                disabled={isFinishing}
                className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/50 active:scale-95 transition disabled:opacity-50"
              >
                {isFinishing ? "Salvando..." : "Concluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExerciseExecutionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-500 animate-pulse">Carregando Treino...</div>}>
      <ExerciseExecutionContent />
    </Suspense>
  )
}
