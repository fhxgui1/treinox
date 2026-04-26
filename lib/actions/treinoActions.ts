"use server";

import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "./authActions";

const dbUrl = process.env.NEON_DATABASE;

function getSql() {
  if (!dbUrl) throw new Error("NEON_DATABASE is not set.");
  return neon(dbUrl);
}

// ==========================================
// 1. CATALOGO E EXERCÍCIOS
// ==========================================

export async function getExerciseCatalog() {
  const sql = getSql();
  const rows = await sql`SELECT id, name, muscle_group FROM exercise_catalog ORDER BY muscle_group ASC, name ASC`;
  return rows.map(r => ({ ...r }));
}

export async function createExercise(name: string, muscle_group: string) {
  const sql = getSql();
  const res = await sql`
    INSERT INTO exercise_catalog (name, muscle_group)
    VALUES (${name}, ${muscle_group})
    RETURNING id, name, muscle_group
  `;
  return { ...res[0] };
}

// ==========================================
// 2. ADMINISTRAÇÃO E FICHAS DE TREINO
// ==========================================

export async function getPrograms() {
  const sql = getSql();
  const userId = await getSessionUser();
  const rows = await sql`
    SELECT p.id, p.name, p.focus, p.is_active, COUNT(s.id) as sessions_count
    FROM training_programs p
    LEFT JOIN training_sessions s ON s.program_id = p.id
    WHERE p.user_id = ${userId}
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  return rows.map(r => ({ ...r, sessions_count: Number(r.sessions_count) }));
}

export async function toggleProgramActive(programId: number, isActive: boolean) {
  const sql = getSql();
  const userId = await getSessionUser();
  if (isActive) {
    await sql`UPDATE training_programs SET is_active = FALSE WHERE user_id = ${userId}`;
  }
  await sql`UPDATE training_programs SET is_active = ${isActive} WHERE id = ${programId} AND user_id = ${userId}`;
}

export async function deleteProgram(programId: number) {
  const sql = getSql();
  const userId = await getSessionUser();
  await sql`DELETE FROM program_exercises WHERE session_id IN (SELECT id FROM training_sessions WHERE program_id = ${programId})`;
  await sql`DELETE FROM training_sessions WHERE program_id = ${programId}`;
  await sql`DELETE FROM training_programs WHERE id = ${programId} AND user_id = ${userId}`;
}

export async function getActiveProgram() {
  const sql = getSql();
  const userId = await getSessionUser();
  const programs = await sql`
    SELECT id, name, focus, current_session_index 
    FROM training_programs 
    WHERE user_id = ${userId} AND is_active = TRUE 
    LIMIT 1
  `;
  if (programs.length === 0) return null;

  const activeProgram = programs[0];
  
  // Get its sessions (ordered by sequence_order)
  const sessions = await sql`
    SELECT id, name, sequence_order 
    FROM training_sessions 
    WHERE program_id = ${activeProgram.id} 
    ORDER BY sequence_order ASC
  `;

  return { ...activeProgram, sessions: sessions.map(s => ({ ...s })) };
}

export async function getProgramById(programId: number) {
  const sql = getSql();
  const userId = await getSessionUser();
  
  // Fetch Program
  const pRows = await sql`SELECT id, name, focus, is_active FROM training_programs WHERE id = ${programId} AND user_id = ${userId}`;
  if (pRows.length === 0) return null;
  const program = pRows[0];

  // Fetch Sessions
  const sRows = await sql`SELECT id, name, sequence_order FROM training_sessions WHERE program_id = ${programId} ORDER BY sequence_order ASC`;
  const sessions: any[] = sRows.map(s => ({ ...s, exercises: [] as any[] }));

  // Fetch Exercises 
  for (let s of sessions) {
    const eRows = await sql`
      SELECT pe.id as ex_id, pe.exercise_catalog_id, c.name, pe.sets, pe.target_reps, pe.sequence_order
      FROM program_exercises pe
      JOIN exercise_catalog c ON pe.exercise_catalog_id = c.id
      WHERE pe.session_id = ${s.id}
      ORDER BY pe.sequence_order ASC
    `;
    s.exercises = eRows.map(e => ({ ...e }));
  }

  return { ...program, sessions };
}

// MOCK OR REAL SAVE: to completely persist nested objects (program -> session -> exercise) is complex in one go without an ORM.
// Keeping this out of scope here unless specifically hitting the editing page right away.

export async function saveProgramDetails(
  programData: { id: number | null; name: string; focus: string; is_active: boolean },
  sessions: { name: string; sequence_order: number; exercises: { catalog_id: number; sets: number; reps: number; sequence_order: number }[] }[]
) {
  const sql = getSql();
  const userId = await getSessionUser();

  if (programData.is_active) {
    await sql`UPDATE training_programs SET is_active = FALSE WHERE user_id = ${userId}`;
  }

  let finalProgramId = programData.id;

  if (finalProgramId) {
    // Update existing
    await sql`
      UPDATE training_programs 
      SET name = ${programData.name}, focus = ${programData.focus}, is_active = ${programData.is_active}
      WHERE id = ${finalProgramId} AND user_id = ${userId}
    `;
    // Clean old sessions to replace them safely
    await sql`DELETE FROM program_exercises WHERE session_id IN (SELECT id FROM training_sessions WHERE program_id = ${finalProgramId})`;
    await sql`DELETE FROM training_sessions WHERE program_id = ${finalProgramId}`;
  } else {
    // Insert new Program
    const pRows = await sql`
      INSERT INTO training_programs (user_id, name, focus, is_active) 
      VALUES (${userId}, ${programData.name}, ${programData.focus}, ${programData.is_active})
      RETURNING id
    `;
    finalProgramId = pRows[0].id;
  }

  // Insert Sessions & Exercises
  for (const s of sessions) {
    const sRows = await sql`
      INSERT INTO training_sessions (program_id, name, sequence_order)
      VALUES (${finalProgramId}, ${s.name}, ${s.sequence_order})
      RETURNING id
    `;
    const newSessionId = sRows[0].id;

    for (const ex of s.exercises) {
      await sql`
        INSERT INTO program_exercises (session_id, exercise_catalog_id, sets, target_reps, sequence_order)
        VALUES (${newSessionId}, ${ex.catalog_id}, ${ex.sets}, ${ex.reps}, ${ex.sequence_order})
      `;
    }
  }
}

// ==========================================
// 3. EXECUÇÃO DE TREINO
// ==========================================

export async function getSessionDetails(sessionId: number) {
  const sql = getSql();
  
  // Fetch session
  const sessions = await sql`SELECT id, name, program_id FROM training_sessions WHERE id = ${sessionId}`;
  if (sessions.length === 0) return null;
  const session = sessions[0];

  // Fetch exercises inside the session using program_exercises joining exercise_catalog
  const exercises = await sql`
    SELECT pe.id as program_exercise_id, pe.sets, pe.target_reps, pe.sequence_order, c.name, c.muscle_group, c.id as catalog_id
    FROM program_exercises pe
    JOIN exercise_catalog c ON pe.exercise_catalog_id = c.id
    WHERE pe.session_id = ${sessionId}
    ORDER BY pe.sequence_order ASC
  `;
  
  return { ...session, exercises: exercises.map(e => ({ ...e })) };
}

export async function saveWorkoutLog(
  programId: number, 
  sessionId: number, 
  exercisesHistory: { program_exercise_id: number, catalog_id: number, sets: { reps: number, weight: number }[] }[],
  partnerHistory?: { program_exercise_id: number, catalog_id: number, sets: { reps: number, weight: number }[] }[]
) {
  const sql = getSql();
  const userId = await getSessionUser();
  
  // Helper to save a single workout
  const saveForUser = async (targetUserId: string, history: typeof exercisesHistory) => {
    let totalVolume = 0;
    history.forEach(ex => ex.sets.forEach(set => totalVolume += (set.reps * set.weight)));

    const logs = await sql`
      INSERT INTO workout_logs (user_id, program_id, session_id, total_volume_load)
      VALUES (${targetUserId}, ${programId}, ${sessionId}, ${totalVolume})
      RETURNING id
    `;
    const workoutLogId = logs[0].id;

    for (const ex of history) {
      for (let i = 0; i < ex.sets.length; i++) {
          const s = ex.sets[i];
          if (s.reps > 0) {
              await sql`
                INSERT INTO workout_exercise_logs 
                (user_id, workout_log_id, program_exercise_id, exercise_catalog_id, set_number, actual_reps, actual_weight)
                VALUES (${targetUserId}, ${workoutLogId}, ${ex.program_exercise_id}, ${ex.catalog_id}, ${i + 1}, ${s.reps}, ${s.weight})
              `;
          }
      }
    }
  };

  // Save for main user
  await saveForUser(userId, exercisesHistory);

  // If partner history provided, find partner user_id (using a simple logic or mock partner login)
  if (partnerHistory && partnerHistory.length > 0) {
     const partnerRes = await sql`SELECT id FROM users WHERE email = 'parceiro@teste.com' LIMIT 1`;
     if (partnerRes.length > 0) {
        await saveForUser(partnerRes[0].id, partnerHistory);
     }
  }

  // 3. Increment current session sequence in the program to cycle to the next day
  const sessionsCountRes = await sql`SELECT count(*) as total FROM training_sessions WHERE program_id = ${programId}`;
  const totalSessions = Number(sessionsCountRes[0].total);
  
  if (totalSessions > 0) {
      await sql`
        UPDATE training_programs 
        SET current_session_index = (current_session_index + 1) % ${totalSessions}
        WHERE id = ${programId}
      `;
  }
}

// ==========================================
// 4. ANÁLOGOS E ANALYTICS (DASHBOARDS)
// ==========================================

export async function getDashboardVolumeData(period: "month" | "year") {
  const sql = getSql();
  const userId = await getSessionUser();
  
  const history = await sql`
    SELECT w.completed_at, w.total_volume_load, s.name as session_name
    FROM workout_logs w
    LEFT JOIN training_sessions s ON w.session_id = s.id
    WHERE w.user_id = ${userId}
    ORDER BY w.completed_at ASC
  `;
  
  return history.map(h => ({ ...h }));
}

export async function getExerciseAnalysis(catalogId: number) {
  const sql = getSql();
  // Fetch detailed progression curve over time using grouped sets
  const logs = await sql`
    SELECT completed_at::date as date_completed, MAX(actual_weight) as max_weight, AVG(actual_weight) as avg_weight, SUM(volume_load) as session_volume
    FROM workout_exercise_logs
    WHERE exercise_catalog_id = ${catalogId}
    GROUP BY completed_at::date
    ORDER BY completed_at::date ASC
  `;

  const details = await sql`SELECT name, muscle_group FROM exercise_catalog WHERE id = ${catalogId}`;

  return { 
    info: details[0] || null, 
    evolution: logs.map(l => ({ ...l, avg_weight: Number(l.avg_weight).toFixed(1) })) 
  };
}

export async function getTreinosAnalysis(period: "mensal" | "anual") {
  const sql = getSql();
  const userId = await getSessionUser();
  const daysLimit = period === "mensal" ? 30 : 365;

  const logs = await sql`
     SELECT completed_at::date as date_completed, SUM(total_volume_load) as volume
     FROM workout_logs
     WHERE user_id = ${userId} AND completed_at >= NOW() - (${daysLimit} * INTERVAL '1 day')
     GROUP BY completed_at::date
     ORDER BY completed_at::date ASC
  `;

  const exercises = await sql`
    WITH stats AS (
      SELECT 
        l.exercise_catalog_id as id,
        c.name,
        c.muscle_group,
        MIN(l.actual_weight) as min_weight,
        MAX(l.actual_weight) as max_weight,
        MIN(l.actual_reps) as min_reps,
        MAX(l.actual_reps) as max_reps,
        MIN(l.volume_load) as min_vol,
        MAX(l.volume_load) as max_vol
      FROM workout_exercise_logs l
      JOIN exercise_catalog c ON c.id = l.exercise_catalog_id
      WHERE l.completed_at >= NOW() - (${daysLimit} * INTERVAL '1 day')
      GROUP BY l.exercise_catalog_id, c.name, c.muscle_group
    )
    SELECT *, 
      (max_weight - min_weight) as carga_delta,
      (max_reps - min_reps) as rep_delta,
      (max_vol - min_vol) as volume_delta
    FROM stats
    ORDER BY volume_delta DESC
  `;

  return {
     chart: logs.map(l => {
       const d = new Date(l.date_completed);
       return { date: `${d.getDate()}/${d.getMonth()+1}`, volume: Number(l.volume) };
     }),
     exercises: exercises.map(e => ({
       id: e.id,
       name: e.name,
       muscleGroup: e.muscle_group,
       cargaDelta: Number(e.carga_delta),
       repDelta: Number(e.rep_delta),
       volumeDelta: Number(e.volume_delta)
     }))
  };
}
