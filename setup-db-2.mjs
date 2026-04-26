import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE);

async function main() {
  console.log("Adding partnerships table...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS partnerships (
          id SERIAL PRIMARY KEY,
          requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
          receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'PENDING', 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(requester_id, receiver_id)
      )
    `;

    console.log("Partnerships table created successfully!");
  } catch(e) {
    console.error(e);
  }
}
main();
