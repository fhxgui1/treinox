"use client";

import React, { useState } from "react";
import { ChevronLeft, Save, Dumbbell } from "lucide-react";
import Link from "next/link";
import { createExercise } from "@/lib/actions/treinoActions";

export default function CadastrosPage() {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("Peitoral");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setSuccessMsg("");
    try {
      await createExercise(name, muscleGroup);
      setSuccessMsg("Exercício cadastrado com sucesso!");
      setName("");
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 font-sans flex flex-col">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex items-center shadow-md z-10 sticky top-0">
        <Link href="/treino" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition active:scale-95">
          <ChevronLeft className="w-6 h-6 text-zinc-400" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-white ml-2">
          Cadastros
        </h1>
      </div>

      <div className="px-4 py-8 max-w-md mx-auto w-full">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-emerald-500/10 p-3 rounded-2xl">
            <Dumbbell className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Novo Exercício</h2>
            <p className="text-zinc-500 text-sm">Preencha os dados e adicione ao catálogo</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">
              Nome do Exercício
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supino Reto com Halteres"
              className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm font-semibold"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 ml-1">
              Grupo Muscular
            </label>
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm font-semibold appearance-none"
            >
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 transition active:scale-95 disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? "Salvando..." : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Cadastrar Exercício
              </>
            )}
          </button>
        </form>

        {successMsg && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center font-bold text-sm">
            {successMsg}
          </div>
        )}
      </div>
    </div>
  );
}
