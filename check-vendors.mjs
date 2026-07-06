import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: "postgresql://postgres.uvdmuzunnkjbsbhxlquj:Pan02da%23Pcmb@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres" });

async function run() {
  try {
    const query = `SELECT * FROM "vendors" LIMIT 5;`;
    const res = await pool.query(query);
    console.log("Total vendors returned:", res.rows.length);
    console.log(res.rows);
  } catch (err) {
    console.error("POSTGRES ERROR:", err);
  } finally {
    process.exit(0);
  }
}
run();
