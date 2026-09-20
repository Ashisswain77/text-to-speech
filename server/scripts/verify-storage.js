import { verifyStorageHealth } from '../services/storage.service.js';
import { config } from '../config/env.js';

console.log('Testing Supabase Storage connectivity via server/services/storage.service.js...');
console.log(`Target Bucket: ${config.supabase.bucket}`);
console.log(`Supabase URL: ${config.supabase.url || '(not set in server/.env)'}`);

try {
  const result = await verifyStorageHealth();

  if (result.ok && result.exists) {
    console.log('----------------------------------------------------');
    console.log('SUCCESS: Connected to Supabase Storage!');
    console.log(`Bucket Name: ${result.bucket}`);
    console.log(`Bucket Exists: YES`);
    console.log(`Is Public: ${result.metadata?.isPublic ? 'YES' : 'NO (Private)'}`);
    console.log(`File Size Limit: ${result.metadata?.fileSizeLimit ? `${result.metadata.fileSizeLimit / (1024 * 1024)} MB` : 'Unlimited'}`);
    console.log(`Allowed MIME Types: ${result.metadata?.allowedMimeTypes?.length ? result.metadata.allowedMimeTypes.join(', ') : 'All'}`);
    console.log(`Latency: ${result.latencyMs}ms`);
    console.log('----------------------------------------------------');
    process.exit(0);
  } else if (result.ok && !result.exists) {
    console.warn('----------------------------------------------------');
    console.warn('WARNING: Supabase Storage connected, but bucket was not found.');
    console.warn(`Bucket Name: ${result.bucket}`);
    console.warn(`Latency: ${result.latencyMs}ms`);
    console.warn('Please ensure the "speech-audio" bucket is created in your Supabase Dashboard.');
    console.warn('----------------------------------------------------');
    process.exit(1);
  } else {
    console.error('----------------------------------------------------');
    console.error('FAILURE: Supabase Storage health check failed');
    console.error(`Bucket: ${result.bucket}`);
    console.error(`Error: ${result.error}`);
    console.error('----------------------------------------------------');
    process.exit(1);
  }
} catch (err) {
  console.error('----------------------------------------------------');
  console.error('FAILURE: Could not connect to Supabase Storage');
  console.error(`Error Message: ${err.message}`);
  console.error('----------------------------------------------------');
  process.exit(1);
}
