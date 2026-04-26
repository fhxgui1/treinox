"use server";

import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const dbUrl = process.env.NEON_DATABASE;

export async function login(email: string) {
  if (!dbUrl) throw new Error("NEON_DATABASE is not set.");
  const sql = neon(dbUrl);
  
  const users = await sql`SELECT id FROM users WHERE email = ${email}`;
  
  if (users.length === 0) {
    throw new Error("Usuário não encontrado.");
  }
  
  const userId = users[0].id;
  
  // Set session cookie valid for 30 days
  const cookieStore = await cookies();
  cookieStore.set("user_session", userId, { 
    path: "/", 
    maxAge: 30 * 24 * 60 * 60,
    httpOnly: true,
    sameSite: "lax"
  });
  
  redirect("/");
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_session")?.value;
  return userId || "00000000-0000-0000-0000-000000000000"; // fallback to Mock for dev
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("user_session");
  redirect("/login");
}
