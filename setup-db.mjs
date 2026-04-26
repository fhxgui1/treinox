import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE);

async function main() {
  console.log("Adding columns if not exists...");
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`;

    const users = await sql`SELECT id FROM users WHERE id = '00000000-0000-0000-0000-000000000000'`;
    if (users.length === 0) {
      await sql`INSERT INTO users (id, name, email, password) VALUES ('00000000-0000-0000-0000-000000000000', 'Atleta 1', 'atleta@teste.com', '123456')`;
    }
    
    const partner = await sql`SELECT id FROM users WHERE email = 'parceiro@teste.com'`;
    if (partner.length === 0) {
      await sql`INSERT INTO users (name, email, password) VALUES ('Atleta 2', 'parceiro@teste.com', '123456')`;
    }
    
    console.log("Mock users created successfully!");

  } catch(e) {
    console.error(e);
  }
}
main();
