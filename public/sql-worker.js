
// sql-worker.js
importScripts("https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js");

self.onmessage = async (event) => {
  const { action, payload } = event.data;

  if (action === "init") {
    try {
      const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}` });
      self.db = new SQL.Database();
      self.postMessage({ type: "init_success" });
    } catch (error) {
      self.postMessage({ type: "error", error: error.message });
    }
  }

  if (action === "create_table") {
    const { schema, data } = payload;
    try {
      self.db.exec(schema);
      const stmt = self.db.prepare(`INSERT INTO data VALUES (${Object.keys(data[0]).map(() => '?').join(',')})`);
      data.forEach(row => {
        stmt.run(Object.values(row).map(value => typeof value === 'object' ? JSON.stringify(value) : value));
      });
      stmt.free();
      self.postMessage({ type: "create_table_success" });
    } catch (error) {
        console.error("Worker Error:", error);
      self.postMessage({ type: "error", error: error.message });
    }
  }

  if (action === "exec") {
    const { sql } = payload;
    try {
      const results = self.db.exec(sql);
      self.postMessage({ type: "exec_result", results });
    } catch (error) {
      console.error("Worker Error:", error);
      self.postMessage({ type: "error", error: error.message });
    }
  }
};
