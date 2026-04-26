"use server";

import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "./authActions";
import { revalidatePath } from "next/cache";

const dbUrl = process.env.NEON_DATABASE;

function getSql() {
  if (!dbUrl) throw new Error("NEON_DATABASE is not set.");
  return neon(dbUrl);
}

export async function searchUsers(email: string) {
  const sql = getSql();
  const currentUserId = await getSessionUser();
  const users = await sql`
    SELECT id, name, email 
    FROM users 
    WHERE email ILIKE ${'%' + email + '%'} AND id != ${currentUserId}
    LIMIT 5
  `;
  return users.map(u => ({ ...u }));
}

export async function sendPartnerRequest(receiverId: string) {
  const sql = getSql();
  const currentUserId = await getSessionUser();

  // Check if they already have an active request
  const existing = await sql`
    SELECT id FROM partnerships 
    WHERE (requester_id = ${currentUserId} AND receiver_id = ${receiverId})
       OR (requester_id = ${receiverId} AND receiver_id = ${currentUserId})
  `;

  if (existing.length > 0) {
    throw new Error("Solicitação já enviada ou já são parceiros.");
  }

  await sql`
    INSERT INTO partnerships (requester_id, receiver_id, status)
    VALUES (${currentUserId}, ${receiverId}, 'PENDING')
  `;
  revalidatePath("/");
}

export async function getPendingRequests() {
  const sql = getSql();
  const currentUserId = await getSessionUser();
  
  const requests = await sql`
    SELECT p.id as request_id, u.id as user_id, u.name, u.email 
    FROM partnerships p
    JOIN users u ON p.requester_id = u.id
    WHERE p.receiver_id = ${currentUserId} AND p.status = 'PENDING'
  `;
  return requests.map(r => ({ ...r, request_id: Number(r.request_id) }));
}

export async function acceptPartnerRequest(requestId: number) {
  const sql = getSql();
  const currentUserId = await getSessionUser();
  // Double check the request belongs to current user
  await sql`
    UPDATE partnerships 
    SET status = 'ACCEPTED'
    WHERE id = ${requestId} AND receiver_id = ${currentUserId}
  `;
  revalidatePath("/");
}

export async function declinePartnerRequest(requestId: number) {
  const sql = getSql();
  const currentUserId = await getSessionUser();
  await sql`
    DELETE FROM partnerships 
    WHERE id = ${requestId} AND receiver_id = ${currentUserId}
  `;
  revalidatePath("/");
}

export async function getActivePartners() {
  const sql = getSql();
  const currentUserId = await getSessionUser();
  
  const partners = await sql`
    SELECT 
      p.id as partnership_id,
      CASE 
        WHEN p.requester_id = ${currentUserId} THEN u_rec.id
        ELSE u_req.id
      END as user_id,
      CASE 
        WHEN p.requester_id = ${currentUserId} THEN u_rec.name
        ELSE u_req.name
      END as name,
      CASE 
        WHEN p.requester_id = ${currentUserId} THEN u_rec.email
        ELSE u_req.email
      END as email
    FROM partnerships p
    LEFT JOIN users u_req ON p.requester_id = u_req.id
    LEFT JOIN users u_rec ON p.receiver_id = u_rec.id
    WHERE (p.requester_id = ${currentUserId} OR p.receiver_id = ${currentUserId})
      AND p.status = 'ACCEPTED'
  `;
  return partners.map(p => ({ ...p }));
}

// Retorna o mock do usuário para recuperar o id logado pela UI (Next15 Server Actions return type limitations on simple objects sometimes, but here we return string)
export async function getMyUserId() {
  return await getSessionUser();
}
