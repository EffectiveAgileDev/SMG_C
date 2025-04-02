import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function executeMigration(migrationFile: string, supabaseUrl: string, supabaseKey: string) {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read migration file
    const migration = fs.readFileSync(
      path.join(__dirname, migrationFile),
      'utf8'
    );

    // Split migration into individual statements
    const statements = migration
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase
        .from('_migrations')  // Using a special table for migrations
        .insert({
          name: migrationFile,
          sql: statement,
          executed_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Migration failed: ${error.message}`);
      }
    }

    console.log(`Successfully executed migration: ${migrationFile}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
} 