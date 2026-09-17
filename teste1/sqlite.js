'use strict';

require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const { existsSync } = require('node:fs');
const path = require('node:path');

const filename = path.resolve(__dirname, process.env.SQLITE_PATH || 'blockchain.sqlite');
if (!existsSync(filename)) throw new Error(`Banco SQLite não encontrado: ${filename}`);
const database = new DatabaseSync(filename, { timeout: 5000 });

// Serializa operações e reserva a conexão durante toda a transação.
let pending = Promise.resolve();
async function acquire() {
  const previous = pending;
  let unlock;
  pending = new Promise(resolve => { unlock = resolve; });
  await previous;
  return unlock;
}

function execute(sql, values = []) {
  const statement = database.prepare(sql);
  const params = (Array.isArray(values) ? values : [values]).map(value => {
    if (value === undefined) return null;
    if (typeof value === 'boolean') return Number(value);
    return value;
  });
  const columns = statement.columns();
  if (columns.length) {
    const rows = statement.all(...params).map(record => {
      const row = { ...record };
      // Mantém os tipos que o driver anterior retornava para JSON e DATETIME.
      for (const column of columns) {
        const value = row[column.name];
        if (value === null) continue;
        if (column.column === 'ch_hash' || column.column === 'infodata') {
          row[column.name] = JSON.parse(value);
        } else if (column.column === 'time_stamp') {
          row[column.name] = new Date(value.replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(value) ? '' : 'Z'));
        }
      }
      return row;
    });
    return [rows, columns];
  }
  const result = statement.run(...params);
  return [{ affectedRows: result.changes, insertId: result.lastInsertRowid }, []];
}

function createConnection() {
  let unlockTransaction = null;
  let released = false;
  return {
    async query(sql, values) {
      if (released) throw new Error('Conexão SQLite já liberada.');
      if (unlockTransaction) return execute(sql, values);
      const unlock = await acquire();
      try { return execute(sql, values); } finally { unlock(); }
    },
    async beginTransaction() {
      if (released || unlockTransaction) throw new Error('Estado de transação inválido.');
      const unlock = await acquire();
      try {
        database.exec('BEGIN IMMEDIATE');
        unlockTransaction = unlock;
      } catch (error) { unlock(); throw error; }
    },
    async commit() {
      if (!unlockTransaction) return;
      database.exec('COMMIT');
      unlockTransaction();
      unlockTransaction = null;
    },
    async rollback() {
      if (!unlockTransaction) return;
      try { database.exec('ROLLBACK'); } finally {
        unlockTransaction();
        unlockTransaction = null;
      }
    },
    release() {
      if (unlockTransaction) {
        try { database.exec('ROLLBACK'); } finally {
          unlockTransaction();
          unlockTransaction = null;
        }
      }
      released = true;
    },
  };
}

module.exports = {
  async query(sql, values) {
    const connection = createConnection();
    try { return await connection.query(sql, values); } finally { connection.release(); }
  },
  async getConnection() { return createConnection(); },
  async end() {
    const unlock = await acquire();
    try { database.close(); } finally { unlock(); }
  },
};
