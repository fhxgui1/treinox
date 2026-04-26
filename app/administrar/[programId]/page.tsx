"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, Save, Plus, Trash2, GripVertical, Info, Dumbbell, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getExerciseCatalog, saveProgramDetails, createExercise, getProgramById } from "@/lib/actions/treinoActions";

// --- Types & Mock Data ---

interface ExerciseInSession {
  id: string;
  exerciseName: string;
  sets: number;
  reps: number;
}

interface Session {
  id: string;
  name: string;
  exercises: ExerciseInSession[];
}



export default function EditCreateProgramPage() {
  const params = useParams();
  const router = useRouter();
  
  const programId = params.programId as string;
  const isNew = programId === "nova";

  // States
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [setActiveNow, setSetActiveNow] = useState(isNew);
  const [dbExercises, setDbExercises] = useState<{id: number, name: string, muscle_group: string}[]>([]);
  const [showNewExerciseModal, setShowNewExerciseModal] = useState<{sessionId: string, exerciseId: string} | null>(null);

  useEffect(() => {
    getExerciseCatalog().then((exercises) => setDbExercises(exercises as any));
  }, []);

  useEffect(() => {
    if (!isNew && programId) {
      getProgramById(Number(programId)).then((rawData) => {
        const data = rawData as any;
        if (data) {
          setName(data.name);
          setFocus(data.focus);
          setSetActiveNow(data.is_active);
          
          const mappedSessions = data.sessions.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            exercises: s.exercises.map((e: any) => ({
              id: String(e.ex_id),
              exerciseName: e.name,        // binds to the select option
              sets: Number(e.sets),
              reps: Number(e.target_reps), // target_reps -> reps
            }))
          }));
          setSessions(mappedSessions);
        }
      });
    }
  }, [programId, isNew]);

  // --- Session Handlers ---
  const handleAddSession = () => {
    const newSession: Session = { 
      id: `s_${Date.now()}`, 
      name: `Treino ${String.fromCharCode(65 + sessions.length)}`,
      exercises: [] 
    };
    setSessions([...sessions, newSession]);
  };

  const handleRemoveSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleChangeSessionName = (id: string, newName: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  // --- Exercise Handlers ---
  const handleAddExercise = (sessionId: string) => {
    setSessions(sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          exercises: [...s.exercises, { id: `e_${Date.now()}`, exerciseName: "", sets: 3, reps: 10 }]
        };
      }
      return s;
    }));
  };

  const handleRemoveExercise = (sessionId: string, exerciseId: string) => {
    setSessions(sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, exercises: s.exercises.filter(e => e.id !== exerciseId) };
      }
      return s;
    }));
  };

  const handleChangeExercise = (sessionId: string, exerciseId: string, field: keyof ExerciseInSession, value: any) => {
    setSessions(sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          exercises: s.exercises.map(e => e.id === exerciseId ? { ...e, [field]: value } : e)
        };
      }
      return s;
    }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find the ID values based on `exerciseName` matching the DB `name`
      const formattedSessions = sessions.map((s, sIndex) => {
        return {
          name: s.name,
          sequence_order: sIndex,
          exercises: s.exercises.map((ex, eIndex) => {
            const hit = dbExercises.find(dbEx => dbEx.name === ex.exerciseName);
            return {
              catalog_id: hit ? hit.id : 0, 
              sets: ex.sets,
              reps: ex.reps,
              sequence_order: eIndex
            };
          }).filter(e => e.catalog_id > 0) // discard invalid unselected items
        };
      });

      await saveProgramDetails(
        { id: isNew ? null : Number(programId), name, focus, is_active: setActiveNow },
        formattedSessions
      );

      router.push("/treino/administrar");
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-32 font-sans">
      
      {/* Top Navigation */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex items-center shadow-md z-10 sticky top-0 mt-safe">
        <Link href="/treino/administrar" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition active:scale-95">
          <ChevronLeft className="w-6 h-6 text-zinc-400" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-white ml-2">
          {isNew ? "Montar Nova Ficha" : "Editar Ficha"}
        </h1>
      </div>

      <div className="px-4 mt-6 space-y-6">
        
        {/* Info Box */}
        {isNew && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start space-x-3">
            <Info className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Estruture sua ficha. Crie primeiramente os seus "Dias de Treino" e em seguida adicione os exercícios específicos, definindo as séries e repetições de cada um!
            </p>
          </div>
        )}

        {/* Global Details */}
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">
              Nome da Ficha
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Hipertrofia ABCD"
              className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm font-semibold"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">
              Foco do Treinamento
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Ex: Foco em Braços e Dorsal"
              className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm font-semibold"
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex flex-col">
              <span className="font-bold text-white">Usar Imediatamente</span>
              <span className="text-xs text-zinc-500">Tornar esta ficha ativa após salvar</span>
            </div>
            <button 
              onClick={() => setSetActiveNow(!setActiveNow)}
              className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                setActiveNow ? "bg-emerald-500" : "bg-zinc-700"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                setActiveNow ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>
        </div>

        {/* Sessions & Exercises Builder Area */}
        <div className="pt-6 border-t border-zinc-800">
          <h2 className="text-xl font-bold text-white mb-1">Divisões (Dias de Treino)</h2>
          <p className="text-sm text-zinc-500 mb-6">Monte a estrutura de cada sessão (ex: Treino A) e coloque os exercícios nela.</p>

          <div className="space-y-6 mb-6">
            {sessions.map((session) => (
              <div key={session.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                
                {/* Session Header */}
                <div className="bg-zinc-800/50 border-b border-zinc-800 p-3 flex items-center space-x-2">
                  <div className="p-2 text-zinc-500 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <input
                    type="text"
                    value={session.name}
                    onChange={(e) => handleChangeSessionName(session.id, e.target.value)}
                    className="flex-1 bg-zinc-950 border border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-900 text-white focus:outline-none p-2 rounded-lg font-bold transition-all"
                    placeholder="Nome (Ex: Treino A - Peito)"
                  />
                  
                  <button 
                    onClick={() => handleRemoveSession(session.id)}
                    className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition active:scale-95 flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Exercises List within Session */}
                <div className="p-4 space-y-3">
                  {session.exercises.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 border border-dashed border-zinc-700 rounded-xl bg-zinc-900/50">
                      Nenhum exercício ainda.
                    </div>
                  ) : (
                    session.exercises.map((ex, index) => (
                      <div key={ex.id} className="flex flex-col sm:flex-row gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800 items-start sm:items-center">
                        
                        <div className="flex items-center text-zinc-600 font-bold w-6 hidden sm:flex">
                          {index + 1}.
                        </div>
                        
                        {/* Exercise Name */}
                        <div className="flex-1 w-full">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1 mb-1 block">Exercício</label>
                          <select
                            value={ex.exerciseName}
                            onChange={(e) => {
                              if (e.target.value === "NEW_EXERCISE") {
                                setShowNewExerciseModal({ sessionId: session.id, exerciseId: ex.id });
                              } else {
                                handleChangeExercise(session.id, ex.id, "exerciseName", e.target.value);
                              }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 text-sm font-semibold appearance-none"
                          >
                            <option value="" disabled>Selecione um exercício...</option>
                            <option value="NEW_EXERCISE" className="text-emerald-500 font-bold">➕ Criar Novo Exercício</option>
                            {dbExercises.map((dbEx) => (
                              <option key={dbEx.id} value={dbEx.name}>
                                {dbEx.name} ({dbEx.muscle_group})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Series & Reps grouping */}
                        <div className="flex gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                          {/* Sets (Séries) */}
                          <div className="w-20">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1 mb-1 block">Séries</label>
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => handleChangeExercise(session.id, ex.id, "sets", parseInt(e.target.value) || 0)}
                              className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 text-sm font-bold text-center"
                            />
                          </div>

                          {/* Reps */}
                          <div className="w-24">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1 mb-1 block">Reps</label>
                            <input
                              type="number"
                              value={ex.reps}
                              onChange={(e) => handleChangeExercise(session.id, ex.id, "reps", parseInt(e.target.value) || 0)}
                              className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 text-sm font-bold text-center"
                            />
                          </div>
                          
                          {/* Remove Exercise */}
                          <div className="flex items-end pb-0.5">
                            <button 
                              onClick={() => handleRemoveExercise(session.id, ex.id)}
                              className="p-2 text-zinc-500 hover:text-rose-500 bg-zinc-900 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/50 rounded-lg transition active:scale-95 h-9 w-9 flex items-center justify-center mt-auto"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))
                  )}

                  {/* Add Exercise Button */}
                  <div className="pt-2 flex">
                    <button 
                      onClick={() => handleAddExercise(session.id)}
                      className="flex items-center text-sm px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold rounded-lg hover:bg-emerald-500/20 transition active:scale-95"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Adicionar Exercício
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleAddSession}
            className="w-full flex items-center justify-center py-4 bg-zinc-900 border border-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-800 transition active:scale-95 shadow-sm"
          >
            <Dumbbell className="w-5 h-5 mr-2 text-emerald-500" />
            Adicionar Novo Dia (Divisão)
          </button>

        </div>

      </div>

      {/* Floating Action Button (Save Form) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/80 backdrop-blur-md z-40 border-t border-zinc-800">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-900/50 hover:bg-emerald-500 transition active:scale-95 disabled:opacity-50"
        >
          <Save className="w-6 h-6 mr-2" />
          {isSaving ? "Salvando..." : (isNew ? "Montar Ficha no Sistema" : "Atualizar Estrutura")}
        </button>
      </div>

      {/* New Exercise Modal (Inline DB Registration) */}
      {showNewExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative border border-zinc-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Novo Exercício</h3>
            <p className="text-zinc-500 text-xs mb-6">Cadastre na base e adicione ele já nesta série.</p>
            
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1 mb-1 block">Nome do Exercício</label>
            <input 
              type="text" id="newExName" placeholder="Ex: Tríceps Testa"
              className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl mb-4 focus:outline-none focus:border-emerald-500 transition"
            />
            
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1 mb-1 block">Grupo Principal</label>
            <select id="newExGroup" className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl mb-8 focus:outline-none focus:border-emerald-500 appearance-none transition">
              <option value="Peitoral">Peitoral</option>
              <option value="Costas">Costas</option>
              <option value="Pernas">Pernas</option>
              <option value="Ombros">Ombros</option>
              <option value="Bíceps">Bíceps</option>
              <option value="Tríceps">Tríceps</option>
              <option value="Abdômen">Abdômen</option>
              <option value="Panturrilha">Panturrilha</option>
              <option value="Glúteos">Glúteos</option>
              <option value="Antebraço">Antebraço</option>
              <option value="Outros">Outros</option>
            </select>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowNewExerciseModal(null)} 
                className="flex-1 py-3.5 text-zinc-400 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={async (e) => {
                   const btn = e.currentTarget;
                   const nName = (document.getElementById('newExName') as HTMLInputElement).value;
                   const nGroup = (document.getElementById('newExGroup') as HTMLSelectElement).value;
                   if (!nName) return;
                   
                   btn.disabled = true;
                   btn.innerText = "Criando...";
                   try {
                     const newEx = await createExercise(nName, nGroup);
                     setDbExercises(prev => [...prev, newEx as {id: number, name: string, muscle_group: string}]);
                     handleChangeExercise(showNewExerciseModal.sessionId, showNewExerciseModal.exerciseId, "exerciseName", newEx.name);
                     setShowNewExerciseModal(null);
                   } catch {
                     alert("Erro ao cadastrar.");
                     btn.disabled = false;
                     btn.innerText = "Salvar e Adicionar";
                   }
                }} 
                className="flex-[1.5] py-3.5 text-white bg-emerald-600 rounded-xl font-bold shadow-lg shadow-emerald-900/50 hover:bg-emerald-500 transition active:scale-95"
              >
                Salvar e Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
