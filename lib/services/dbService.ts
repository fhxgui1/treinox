import { ActivityType, Task } from "./types"
import { neon } from "@neondatabase/serverless"

class DatabaseService {
  private get sql() {
    if (!process.env.NEON_DATABASE) {
      throw new Error("NEON_DATABASE environment variable is not set.")
    }
    return neon(process.env.NEON_DATABASE)
  }

  constructor() {}

  // --- MICROSERVICE QUERIES/MUTATIONS --- //

  async getActivityTypes(): Promise<ActivityType[]> {
    const rows = await this.sql`
      SELECT id, name, color_theme FROM activity_types ORDER BY name ASC
    `
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      colorTheme: row.color_theme,
    }))
  }

  async addActivityType(
    name: string,
    colorTheme: string = "bg-blue-100 border-blue-200 text-blue-700"
  ): Promise<ActivityType> {
    const rows = await this.sql`
      INSERT INTO activity_types (name, color_theme)
      VALUES (${name}, ${colorTheme})
      RETURNING id, name, color_theme
    `
    return {
      id: rows[0].id,
      name: rows[0].name,
      colorTheme: rows[0].color_theme,
    }
  }

  async getEvents(): Promise<Task[]> {
    const rows = await this.sql`

      SELECT 
        e.*,
        act.name as activity_type_name,
        act.color_theme as activity_color,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'text', s.text, 'done', s.is_completed) ORDER BY s.step_order
          ) FILTER (WHERE s.id IS NOT NULL), 
          '[]'
        ) AS steps
      FROM events e
      LEFT JOIN event_steps s ON e.id = s.event_id
      LEFT JOIN activity_types act ON e.activity_type_id = act.id
      GROUP BY e.id, act.id

    `

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      start: new Date(row.start_date || new Date()),
      end: new Date(row.end_date || new Date()),
      color: row.activity_color || row.color,
      priority: row.priority as any,
      type: row.activity_type_name || row.category,
      status: row.status,
      location: row.location,
      eventType: row.event_type,
      projectId: row.project_id,
      hasTime: row.has_time !== false,
      activityTypeId: row.activity_type_id,
      steps: row.steps,
    }))
  }

  async getEventById(id: string): Promise<Task | null> {
    const rows = await this.sql`
      SELECT 
        e.*,
        act.name as activity_type_name,
        act.color_theme as activity_color,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'text', s.text, 'done', s.is_completed) ORDER BY s.step_order
          ) FILTER (WHERE s.id IS NOT NULL), 
          '[]'
        ) AS steps
      FROM events e
      LEFT JOIN event_steps s ON e.id = s.event_id
      LEFT JOIN activity_types act ON e.activity_type_id = act.id
      WHERE e.id = ${id}
      GROUP BY e.id, act.id
    `
    if (rows.length === 0) return null

    const row = rows[0]
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      start: new Date(row.start_date || new Date()),
      end: new Date(row.end_date || new Date()),
      color: row.activity_color || row.color,
      priority: row.priority as any,
      type: row.activity_type_name || row.category,
      status: row.status,
      location: row.location,
      eventType: row.event_type,
      projectId: row.project_id,
      hasTime: row.has_time !== false,
      activityTypeId: row.activity_type_id,
      steps: row.steps,
    }
  }

  async getProjectsAndActivities(): Promise<{ id: string; title: string; eventType: string }[]> {
    const rows = await this.sql`
    
      SELECT id, title, event_type
      FROM events
      WHERE event_type IN ('Projeto', 'Atividade')
      and status='Pendente'
      ORDER BY title ASC
    `
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      eventType: row.event_type,
    }))
  }

  async insertEvent(newTask: Omit<Task, "id">): Promise<Task> {
    const rows = await this.sql`
      INSERT INTO events (
        title, description, event_type, start_date, end_date, priority, category, status, location, color, project_id, has_time, activity_type_id
      ) VALUES (
        ${newTask.title},
        ${newTask.description || null},
        ${newTask.eventType || "Tarefa"},
        ${newTask.start},
        ${newTask.end},
        ${newTask.priority || "Média"},
        ${newTask.type || "Pessoal"},
        ${newTask.status || "Pendente"},
        ${newTask.location || null},
        ${newTask.color || "bg-blue-100 border-blue-200 text-blue-700"},
        ${newTask.projectId || null},
        ${newTask.hasTime === undefined ? true : newTask.hasTime},
        ${newTask.activityTypeId || null}
      ) RETURNING *
    `

    const row = rows[0]
    const insertedSteps = []

    if (newTask.steps && newTask.steps.length > 0) {
      for (let i = 0; i < newTask.steps.length; i++) {
        const step = newTask.steps[i]
        if (step.text.trim() === "") continue // Skip empty steps

        const stepRows = await this.sql`
          INSERT INTO event_steps (event_id, text, step_order, is_completed)
          VALUES (${row.id}, ${step.text}, ${i}, ${step.done || false})
          RETURNING *
        `

        if (stepRows.length > 0) {
          insertedSteps.push({
            id: stepRows[0].id,
            text: stepRows[0].text,
            done: stepRows[0].is_completed,
          })
        }
      }
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      start: new Date(row.start_date),
      end: new Date(row.end_date),
      color: row.color,
      priority: row.priority as any,
      type: row.category as any,
      status: row.status,
      location: row.location,
      eventType: row.event_type,
      projectId: row.project_id,
      hasTime: row.has_time,
      activityTypeId: row.activity_type_id,
      steps: insertedSteps,
    }
  }
  // Completes a task/event
  async updateEventStatus(id: string, status: string): Promise<void> {
    await this.sql`UPDATE events SET status = ${status} WHERE id = ${id}`
  }

  // Toggles step completion
  async toggleStep(id: string | number, done: boolean): Promise<void> {
    await this
      .sql`UPDATE event_steps SET is_completed = ${done} WHERE id = ${id}`
  }
}
// Export singleton instance representing our Data Access Layer
export const dbService = new DatabaseService()
