import initSqlJs, { type SQL } from 'sql.js';

let db: SQL.Database | null = null;

self.onmessage = async (event) => {
  const { id, sql, data, schema } = event.data;
  
  try {
    if (!db) {
      const SQL = await initSqlJs({ locateFile: file => `/sql-wasm.wasm` });
      db = new SQL.Database();
      self.postMessage({ id: 'init', results: 'Database initialized' });
    }

    switch (id) {
        case 'init': // Already handled, but prevent error
            break;
        case 'load':
            if (db && data && schema) {
                // Re-initialize DB for new file
                db.close();
                const SQL = await initSqlJs({ locateFile: file => `/sql-wasm.wasm` });
                db = new SQL.Database();
                
                db.run(schema);
                const columns = Object.keys(data[0]);
                const stmt = db.prepare(`INSERT INTO data VALUES (${columns.map(() => '?').join(',')})`);
                data.forEach((row: any) => {
                    const values = columns.map(col => {
                        const val = row[col];
                        // sql.js doesn't handle Date objects, convert them
                        if (val instanceof Date) {
                            return val.toISOString();
                        }
                        return val;
                    });
                    stmt.run(values);
                });
                stmt.free();
                self.postMessage({ id: 'load', results: 'Data loaded' });
            }
            break;
        case 'exec':
            if (db && sql) {
                const results = db.exec(sql);
                self.postMessage({ id, results });
            }
            break;
        case 'reset':
            if (db) {
                db.close();
                const SQL = await initSqlJs({ locateFile: file => `/sql-wasm.wasm` });
                db = new SQL.Database();
                self.postMessage({ id: 'reset', results: 'Database reset' });
            }
            break;
        default:
            throw new Error(`Unknown action: ${id}`);
    }
  } catch (e: any) {
    self.postMessage({ id, error: { message: e.message } });
  }
};
