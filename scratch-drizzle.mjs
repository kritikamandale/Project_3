import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { events } from './src/lib/db/schema.ts'; // assuming running with something that resolves ts? No, node doesn't resolve ts.
