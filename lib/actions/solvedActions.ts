"use server";

import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.NEON_DATABASE;
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000000";

function getSql() {
  if (!dbUrl) throw new Error("NEON_DATABASE is not set.");
  return neon(dbUrl);
}

export async function fetchProblems() {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM problems 
    WHERE user_id = ${MOCK_USER_ID}
    ORDER BY created_at DESC
  `;
  return rows.map(r => ({ ...r }));
}

export async function getProblemById(id: number) {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM problems 
    WHERE id = ${id} AND user_id = ${MOCK_USER_ID}
  `;
  if (rows.length === 0) return null;

  const problem = rows[0];

  const reqs = await sql`
    SELECT id, content, is_completed 
    FROM problem_requirements
    WHERE problem_id = ${id}
    ORDER BY id ASC
  `;

  return { ...problem, requirements: reqs.map(r => ({ ...r })) };
}

export async function createProblem(data: {
  title: string;
  description: string;
  importance: string;
  difficulty: string;
  time_level: string;
  complexity: string;
  status?: string;
  requirements?: { content: string; is_completed: boolean }[];
}) {
  const sql = getSql();
  const status = data.status || "Aberto";
  const rows = await sql`
    INSERT INTO problems (user_id, title, description, importance, difficulty, time_level, complexity, status)
    VALUES (${MOCK_USER_ID}, ${data.title}, ${data.description}, ${data.importance}, ${data.difficulty}, ${data.time_level}, ${data.complexity}, ${status})
    RETURNING id
  `;
  
  const newId = rows[0].id;

  if (data.requirements && data.requirements.length > 0) {
    for (const r of data.requirements) {
      await sql`
        INSERT INTO problem_requirements (problem_id, content, is_completed)
        VALUES (${newId}, ${r.content}, ${r.is_completed})
      `;
    }
  }

  return newId;
}

export async function updateProblem(id: number, data: {
  title: string;
  description: string;
  importance: string;
  difficulty: string;
  time_level: string;
  complexity: string;
  status: string;
  requirements?: { content: string; is_completed: boolean }[];
}) {
  const sql = getSql();
  await sql`
    UPDATE problems 
    SET title = ${data.title}, description = ${data.description}, importance = ${data.importance},
        difficulty = ${data.difficulty}, time_level = ${data.time_level}, complexity = ${data.complexity}, 
        status = ${data.status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND user_id = ${MOCK_USER_ID}
  `;

  await sql`DELETE FROM problem_requirements WHERE problem_id = ${id}`;
  
  if (data.requirements && data.requirements.length > 0) {
    for (const r of data.requirements) {
      await sql`
        INSERT INTO problem_requirements (problem_id, content, is_completed)
        VALUES (${id}, ${r.content}, ${r.is_completed})
      `;
    }
  }
}

export async function deleteProblem(id: number) {
  const sql = getSql();
  await sql`DELETE FROM problem_requirements WHERE problem_id = ${id}`;
  await sql`DELETE FROM problems WHERE id = ${id} AND user_id = ${MOCK_USER_ID}`;
}

export async function toggleRequirement(reqId: number, isCompleted: boolean) {
  const sql = getSql();
  await sql`UPDATE problem_requirements SET is_completed = ${isCompleted} WHERE id = ${reqId}`;
}

export async function markProblemSolved(id: number) {
  const sql = getSql();
  await sql`UPDATE problems SET status = 'Resolvido' WHERE id = ${id} AND user_id = ${MOCK_USER_ID}`;
}
