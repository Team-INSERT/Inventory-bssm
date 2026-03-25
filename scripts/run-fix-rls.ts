import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is missing in .env.local");
    return;
  }

  const pool = new Pool({
    connectionString: dbUrl,
  });

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "..", "fix_users_rls_all.sql"),
      "utf8",
    );
    console.log("Running SQL to fix RLS...");
    await pool.query(sql);
    console.log("✅ Successfully updated RLS policies!");
  } catch (err) {
    console.error("❌ Failed to update RLS policies:", err);
  } finally {
    await pool.end();
  }
}

run();
