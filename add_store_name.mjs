// Adds store_name column to store_sales and online_sales
import pg from "pg";
const { Client } = pg;
const client = new Client({
  host: "db.bnmfhmsidqfqhkvcaqpp.supabase.co",
  port: 5432, database: "postgres", user: "postgres",
  password: "#Dd123891010029", ssl: { rejectUnauthorized: false },
});
async function main() {
  await client.connect();
  await client.query(`ALTER TABLE store_sales  ADD COLUMN IF NOT EXISTS store_name text NOT NULL DEFAULT 'My Store';`);
  await client.query(`ALTER TABLE online_sales ADD COLUMN IF NOT EXISTS store_name text NOT NULL DEFAULT 'My Store';`);
  console.log("Done! store_name column added.");
  await client.end();
}
main().catch(e => { console.error(e.message); client.end(); });
