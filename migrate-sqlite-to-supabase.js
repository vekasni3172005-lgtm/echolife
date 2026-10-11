
require("dotenv").config();

const path = require("path");
const Database = require("better-sqlite3");
const { Pool } = require("pg");

const sqlitePath = path.join(
  __dirname,
  "database",
  "echolife.db"
);

if (!process.env.SUPABASE_DB_URL) {
  throw new Error(
    "SUPABASE_DB_URL is missing from your .env file."
  );
}

const sqlite = new Database(sqlitePath, {
  readonly: true,
  fileMustExist: true
});

// Keep TLS certificate verification enabled.
// The pg library uses its standard TLS configuration.
const pg = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  connectionTimeoutMillis: 10000,
  application_name: "EchoLife SQLite Migration"
});

const tables = ["users", "profiles", "memories"];

async function migrate() {
  let client;
  let transactionStarted = false;

  try {
    console.log("Connecting to Supabase...");
    client = await pg.connect();

    const connectionCheck = await client.query(
      "SELECT current_database() AS database"
    );

    console.log(
      "Connected to database:",
      connectionCheck.rows[0].database
    );

    await client.query("BEGIN");
    transactionStarted = true;

    // Lock destination tables against concurrent writes
    // while checking and performing this migration.
    await client.query(`
      LOCK TABLE
        public.users,
        public.profiles,
        public.memories
      IN EXCLUSIVE MODE
    `);

    // Never overwrite or duplicate existing destination data.
    for (const table of tables) {
      const result = await client.query(
        `SELECT COUNT(*)::int AS total FROM public."${table}"`
      );

      if (result.rows[0].total !== 0) {
        throw new Error(
          `Destination table "${table}" is not empty. ` +
          "Migration stopped without committing changes."
        );
      }
    }

    // Verify source tables exist before inserting anything.
    const sourceTables = sqlite.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
    `).all().map(row => row.name);

    for (const table of tables) {
      if (!sourceTables.includes(table)) {
        throw new Error(
          `SQLite source table "${table}" was not found.`
        );
      }
    }

    // Parent records first, then dependent records.
    for (const table of tables) {
      const rows = sqlite
        .prepare(`SELECT * FROM "${table}"`)
        .all();

      if (rows.length === 0) {
        console.log(`${table}: 0 records`);
        continue;
      }

      const columns = Object.keys(rows[0]);

      // Use explicit column names and parameterized values.
      const columnList = columns
        .map(column => `"${column.replace(/"/g, '""')}"`)
        .join(", ");

      const placeholders = columns
        .map((_, index) => `$${index + 1}`)
        .join(", ");

      const insertSql = `
        INSERT INTO public."${table}" (${columnList})
        VALUES (${placeholders})
      `;

      const insertStatement = {
        text: insertSql,
        rows: 0
      };

      for (const row of rows) {
        await client.query(
          insertStatement.text,
          columns.map(column => row[column])
        );

        insertStatement.rows++;
      }

      console.log(
        `${table}: migrated ${insertStatement.rows} records`
      );
    }

    // Synchronize identity sequences so new records can be added.
    for (const table of tables) {
      const sequenceResult = await client.query(
        "SELECT pg_get_serial_sequence($1, 'id') AS sequence",
        [`public.${table}`]
      );

      const sequence = sequenceResult.rows[0].sequence;

      if (sequence) {
        const maxResult = await client.query(
          `SELECT MAX(id) AS max_id FROM public."${table}"`
        );

        const maxId = maxResult.rows[0].max_id;

        if (maxId !== null) {
          await client.query(
            "SELECT setval($1::regclass, $2, true)",
            [sequence, maxId]
          );
        }
      }
    }

    // Verify row counts before committing.
    for (const table of tables) {
      const sourceCount = sqlite
        .prepare(`SELECT COUNT(*) AS total FROM "${table}"`)
        .get().total;

      const targetResult = await client.query(
        `SELECT COUNT(*)::int AS total FROM public."${table}"`
      );

      const targetCount = targetResult.rows[0].total;

      console.log(
        `${table}: SQLite=${sourceCount}, Supabase=${targetCount}`
      );

      if (sourceCount !== targetCount) {
        throw new Error(
          `Row-count mismatch in "${table}".`
        );
      }
    }

    await client.query("COMMIT");
    transactionStarted = false;

    console.log("\nMigration completed successfully.");
    console.log("SQLite source database was not modified.");
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
        console.error("Transaction rolled back.");
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError.message
        );
      }
    }

    console.error("\nMigration failed.");
    console.error("Error code:", error.code || "N/A");
    console.error("Error message:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }

    await pg.end();
    sqlite.close();
  }
}

migrate();
