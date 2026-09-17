import { testConnection } from '../config/db.js';

console.log('Testing Supabase PostgreSQL connectivity via server/config/db.js...');

try {
  const result = await testConnection();
  console.log('----------------------------------------------------');
  console.log('SUCCESS: Connected to Supabase PostgreSQL!');
  console.log(`Host: ${result.host}:${result.port}`);
  console.log(`Database: ${result.database}`);
  console.log(`User: ${result.user}`);
  console.log(`Latency: ${result.latencyMs}ms`);
  console.log(`Server Time (UTC): ${result.currentTime.toISOString()}`);
  console.log(`PostgreSQL Version: ${result.version}`);
  console.log('----------------------------------------------------');
  process.exit(0);
} catch (err) {
  console.error('----------------------------------------------------');
  console.error('FAILURE: Could not connect to Supabase PostgreSQL');
  console.error(`Error Message: ${err.message}`);
  if (err.code) {
    console.error(`Error Code: ${err.code}`);
  }
  console.error('----------------------------------------------------');
  process.exit(1);
}
