"use client";

import { useState } from "react";
import { login } from "@/lib/actions/authActions";
import { Dumbbell } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-500/10 p-4 rounded-full">
            <Dumbbell className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">Bem-vindo ao Treinox</h1>
        <p className="text-center text-zinc-400 mb-8 text-sm">Faça login para continuar seu progresso (Teste: atleta@teste.com)</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Email de Acesso</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="seu@email.com"
            />
          </div>
          
          {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
          
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/50 transition active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? "Entrando..." : "Acessar Treino"}
          </button>
        </form>
      </div>
    </div>
  );
}
