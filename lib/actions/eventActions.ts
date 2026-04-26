"use server";

import { dbService } from "@/lib/services/dbService";
import { Task } from "@/lib/services/types";

export async function fetchEvents(): Promise<Task[]> {
  return await dbService.getEvents();
}

export async function fetchEventById(id: string): Promise<Task | null> {
  return await dbService.getEventById(id);
}

export async function createEvent(newTask: Omit<Task, "id">): Promise<Task> {
  return await dbService.insertEvent(newTask);
}

export async function updateEventStatus(id: string, status: string): Promise<void> {
  return await dbService.updateEventStatus(id, status);
}

export async function toggleEventStep(stepId: string | number, done: boolean): Promise<void> {
  return await dbService.toggleStep(stepId, done);
}

export async function fetchActivityTypes() {
  return await dbService.getActivityTypes();
}

export async function fetchProjectsAndActivities() {
  return await dbService.getProjectsAndActivities();
}

export async function addActivityType(name: string, colorTheme?: string) {
  return await dbService.addActivityType(name, colorTheme);
}
