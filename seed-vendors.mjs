import pg from 'pg';
import { randomUUID } from 'crypto';

const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://postgres.uvdmuzunnkjbsbhxlquj:Pan02da%23Pcmb@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres" });

const categories = [
  'catering','photography','decoration','venue','entertainment','music',
  'transport','mehendi','makeup','cake','invitation','flowers','tent',
  'light','security','event_planner','choreographer','anchor','priest','other'
];

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Nagpur', 'Pune'];

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
}

async function seedVendors() {
  try {
    let userRes = await pool.query('SELECT id FROM users LIMIT 1');
    let userId;
    
    if (userRes.rows.length === 0) {
      console.log("No users found. Creating a dummy user...");
      const newUser = await pool.query(`
        INSERT INTO users (id, email, full_name, role) 
        VALUES ($1, $2, $3, $4) RETURNING id
      `, [randomUUID(), 'dummy_vendor_owner@example.com', 'Vendor Admin', 'vendor']);
      userId = newUser.rows[0].id;
    } else {
      userId = userRes.rows[0].id;
    }

    console.log(`Using user ID: ${userId} for vendors`);

    const namesByCategory = {
      catering: ['Maharaja Caterers', 'Swad Kitchens'],
      photography: ['Lens & Light Weddings', 'Capture Moments Studio'],
      decoration: ['Royal Mandap Decor', 'Floral Fantasy Planners'],
      venue: ['The Grand Lotus Palace', 'Heritage Courtyard'],
      entertainment: ['Desi Beats Dance Troupe', 'Sufi Soul Entertainers'],
      music: ['Rhythm DJs', 'Saptaswara Live Band'],
      transport: ['Royal Chariots', 'Luxury Wheels India'],
      mehendi: ['Heena Art by Anjali', 'Priya Mehendi Studio'],
      makeup: ['Glamour by Riya', 'Radiant Bride Studio'],
      cake: ['The Royal Bakers', 'Sweet Celebrations'],
      invitation: ['Shubh Lekh Invites', 'Golden Motif Cards'],
      flowers: ['Pushpanjali Florists', 'Blooms & Petals'],
      tent: ['Majestic Tents', 'Rajwada Tent House'],
      light: ['Bright Spark Illuminations', 'Aura Lighting Co'],
      security: ['SafeGuard Events', 'Vanguard Security Services'],
      event_planner: ['Shaadi Makers', 'Elite Event Planners'],
      choreographer: ['Step & Groove', 'Baraat Dance Company'],
      anchor: ['Host with the Most - Rahul', 'Charismatic Ankita'],
      priest: ['Pandit Ji Services', 'Shubh Muhurat Priests'],
      other: ['Event Essentials', 'Celebration Supplies']
    };

    const imageMap = {
      anchor: 'entertainment',
      priest: 'event_planner',
      other: 'flowers'
    };

    // First, clear existing vendors to avoid duplicates and ensure we have a clean slate.
    console.log("Clearing existing vendors...");
    await pool.query('DELETE FROM vendors;');

    const vendorsToInsert = [];

    for (const cat of categories) {
      for (let i = 1; i <= 2; i++) {
        const businessName = namesByCategory[cat][i-1];
        const imageCat = imageMap[cat] || cat;
        const coverImageUrl = `/images/vendors/${imageCat}.png`;

        vendorsToInsert.push([
          randomUUID(),
          userId,
          businessName,
          generateSlug(businessName),
          cat,
          `The best ${cat} services in town.`,
          cities[Math.floor(Math.random() * cities.length)],
          'Maharashtra',
          `987654321${i}`, // fake phone
          Math.floor(Math.random() * 5000) + 1000, // price starting from
          5 + Math.floor(Math.random() * 10), // years experience
          Math.floor(Math.random() * 100), // total events
          (4 + Math.random()).toFixed(1), // average rating
          coverImageUrl
        ]);
      }
    }

    console.log(`Inserting ${vendorsToInsert.length} vendors...`);
    
    for (const v of vendorsToInsert) {
      await pool.query(`
        INSERT INTO vendors (
          id, user_id, business_name, slug, category, description, 
          city, state, phone, price_starting_from, years_experience, 
          total_events_done, average_rating, cover_image_url, is_verified, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'verified', true
        )
      `, v);
    }

    console.log("Successfully seeded vendors!");
  } catch (err) {
    console.error("Error seeding vendors:", err);
  } finally {
    await pool.end();
  }
}

seedVendors();
