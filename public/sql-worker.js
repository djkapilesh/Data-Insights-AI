
importScripts('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js');
import * as xlsx from 'xlsx';

let db = null;

const initSqlJsAndDb = async () => {
    try {
        const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}` });
        db = new SQL.Database();
        postMessage({ type: 'ready' });
    } catch (err) {
        postMessage({ type: 'error', error: err.message });
    }
};


self.onmessage = async (event) => {
    if (!db && event.data.action !== 'init') {
        await initSqlJsAndDb();
    }
    
    const { action, payload } = event.data;

    try {
        switch (action) {
            case 'init':
                await initSqlJsAndDb();
                break;
            case 'create_table': {
                const { schema, data } = payload;
                db.exec(schema);
                
                const sanitizedData = data.map(row => {
                  const newRow = {};
                  for (const key in row) {
                    const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                    newRow[sanitizedKey] = row[key];
                  }
                  return newRow;
                });

                if (sanitizedData.length > 0) {
                    const columns = Object.keys(sanitizedData[0]).map(key => `\`${key}\``).join(',');
                    const placeholders = Object.keys(sanitizedData[0]).map(() => '?').join(',');
                    const stmt = db.prepare(`INSERT INTO data (${columns}) VALUES (${placeholders})`);
                    
                    sanitizedData.forEach(row => {
                        stmt.run(Object.values(row));
                    });

                    stmt.free();
                }
                postMessage({ type: 'table_created' });
                break;
            }
            case 'exec': {
                const { sql } = payload;
                const results = db.exec(sql);
                postMessage({ type: 'exec_result', results: results });
                break;
            }
            default:
                postMessage({ type: 'error', error: 'Unknown action' });
        }
    } catch (err) {
        postMessage({ type: 'error', error: err.message });
    }
};
