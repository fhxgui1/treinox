"use server";

import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.NEON_DATABASE;

function getSql() {
  if (!dbUrl) throw new Error("NEON_DATABASE is not set.");
  return neon(dbUrl);
}

// =====================
// SPACES
// =====================

export async function getSpaces() {
  const sql = getSql();
  const spaces = await sql`SELECT * FROM leaning_spaces ORDER BY name ASC`;
  return spaces.map(s => ({ ...s }));
}

export async function getSpaceById(id: string) {
  const sql = getSql();
  const spaces = await sql`SELECT * FROM leaning_spaces WHERE id = ${id}`;
  return spaces[0] ? { ...spaces[0] } : null;
}

export async function createSpace(name: string, type: string = 'general') {
  const sql = getSql();
  const res = await sql`
    INSERT INTO leaning_spaces (name, type) 
    VALUES (${name}, ${type})
    RETURNING *;
  `;
  return { ...res[0] };
}

// =====================
// NODES & TAGS
// =====================

export async function getNodesBySpace(spaceId: string) {
  const sql = getSql();
  const nodes = await sql`
    SELECT n.* 
    FROM leaning_nodes n
    JOIN leaning_space_nodes sn ON sn.node_id = n.id
    WHERE sn.space_id = ${spaceId}
    ORDER BY n.created_at DESC
  `;
  return nodes.map(n => ({ ...n }));
}

export async function getAllNodes() {
  const sql = getSql();
  const nodes = await sql`SELECT * FROM leaning_nodes ORDER BY created_at DESC`;
  return nodes.map(n => ({ ...n }));
}

export async function createNode(spaceId: string, title: string, type: string, content: string, tags: string[] = []) {
  const sql = getSql();
  
  // Create Node
  const nodeRes = await sql`
    INSERT INTO leaning_nodes (title, type, content)
    VALUES (${title}, ${type}, ${content})
    RETURNING *;
  `;
  const node = { ...nodeRes[0] };

  // Assign to Space
  await sql`
    INSERT INTO leaning_space_nodes (space_id, node_id)
    VALUES (${spaceId}, ${node.id})
  `;

  // Insert Tags
  for (const t of tags) {
    if (t.trim() !== '') {
      await sql`
        INSERT INTO leaning_node_tags (node_id, tag)
        VALUES (${node.id}, ${t.trim()})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  return node;
}

// =====================
// EDGES (CONNECTIONS)
// =====================

export async function getGraphDataBySpace(spaceId: string) {
   // To draw a graph for a space, we need the nodes and their internal edges
   const sql = getSql();
   const nodes = await sql`
     SELECT n.* 
     FROM leaning_nodes n
     JOIN leaning_space_nodes sn ON sn.node_id = n.id
     WHERE sn.space_id = ${spaceId}
   `;

   // Extract UUIDs to filter edges only connecting these nodes
   const nodeIds = nodes.map(n => n.id);

   let edges: any[] = [];
   
   if (nodeIds.length > 0) {
      edges = await sql`
        SELECT * FROM leaning_edges 
        WHERE from_node_id = ANY(${nodeIds}) AND to_node_id = ANY(${nodeIds})
      `;
   }

   return { 
     nodes: nodes.map(n => ({ id: n.id, title: n.title, type: n.type })), 
     links: edges.map(e => ({ source: e.from_node_id, target: e.to_node_id, type: e.type, id: e.id })) 
   };
}

export async function createEdge(fromId: string, toId: string, edgeType: string) {
  const sql = getSql();
  const res = await sql`
    INSERT INTO leaning_edges (from_node_id, to_node_id, type)
    VALUES (${fromId}, ${toId}, ${edgeType})
    ON CONFLICT DO NOTHING
    RETURNING *;
  `;
  return res.length > 0 ? { ...res[0] } : null;
}

// =====================
// FOCUS MODE (NODE DETAILS)
// =====================

export async function getNodeDetails(nodeId: string) {
  const sql = getSql();
  
  // Base Node
  const nRes = await sql`SELECT * FROM leaning_nodes WHERE id = ${nodeId}`;
  if (nRes.length === 0) return null;
  const node = { ...nRes[0] };

  // Tags
  const tagRes = await sql`SELECT tag FROM leaning_node_tags WHERE node_id = ${nodeId}`;
  const tags = tagRes.map(t => t.tag);

  // Contexts (Spaces) it belongs to
  const spaces = await sql`
    SELECT s.id, s.name 
    FROM leaning_spaces s
    JOIN leaning_space_nodes sn ON sn.space_id = s.id
    WHERE sn.node_id = ${nodeId}
  `;

  // Edges (Outgoing and Incoming)
  const outgoing = await sql`
    SELECT e.id as edge_id, e.type as edge_type, n.id as node_id, n.title, n.type
    FROM leaning_edges e
    JOIN leaning_nodes n ON e.to_node_id = n.id
    WHERE e.from_node_id = ${nodeId}
  `;

  const incoming = await sql`
    SELECT e.id as edge_id, e.type as edge_type, n.id as node_id, n.title, n.type
    FROM leaning_edges e
    JOIN leaning_nodes n ON e.from_node_id = n.id
    WHERE e.to_node_id = ${nodeId}
  `;

  return {
    ...node,
    tags,
    spaces: spaces.map(s => ({ ...s })),
    outgoing: outgoing.map(o => ({ ...o })),
    incoming: incoming.map(i => ({ ...i }))
  };
}
