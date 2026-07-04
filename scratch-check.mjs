import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: "postgresql://postgres.uvdmuzunnkjbsbhxlquj:Pan02da%23Pcmb@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres" });

async function run() {
  try {
    const query = `
      INSERT INTO "events" ("id", "slug", "host_id", "title", "description", "event_type", "status", "event_date", "event_time", "end_date", "end_time", "venue_name", "venue_address", "venue_city", "venue_state", "venue_pincode", "expected_guests", "total_budget", "cover_image_url", "theme", "dress_code", "is_private", "invite_token", "template_id", "checklist", "timeline", "metadata") 
      VALUES (default, 'kritika-bday-TR8tCf-test2', '25f14f48-a5e3-497f-b5cf-e4c095c984bb', 'kritika bday', '10th bday', 'birthday', 'draft', '2026-07-08', null, null, null, 'taj hotle', 'Manewada', 'Nagpur', 'Maharashtra', '440027', 50, '1085000', null, null, 'western', true, 'mvu4XFeN4uarPbrmpAgWXrr6pZGIG7BN-test2', 'birthday', '[]', '[]', '{}')
      RETURNING *;
    `;
    await pool.query(query);
    console.log("Success!");
  } catch (err) {
    console.error("POSTGRES ERROR:", err);
  } finally {
    process.exit(0);
  }
}
run();
