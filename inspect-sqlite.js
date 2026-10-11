
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "database", "echolife.db");
const db = new Database(dbPath, { readonly: true });

try {
  const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  for (const { name } of tables) {
    const safeName = name.replace(/"/g, '""');
    const columns = db.prepare(`PRAGMA table_info("${safeName}")`).all();
    const count = db.prepare(`SELECT COUNT(*) AS total FROM "${safeName}"`).get();

    console.log(`\nTable: ${name}`);
    console.log("Rows:", count.total);
    console.log("Columns:", columns.map(c => c.name).join(", "));
  }
} finally {
  db.close();
}
