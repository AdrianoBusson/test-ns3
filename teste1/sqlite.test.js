const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'blockchain-sqlite-'));
process.env.SQLITE_PATH = path.join(temporary, 'test.sqlite');
fs.copyFileSync(path.join(__dirname, 'blockchain.sqlite'), process.env.SQLITE_PATH);
const pool = require('./sqlite');
const db = require('./db');

test('SQLite: leitura, tipos, escrita, rollback e concorrência em cópia do banco', async () => {
  assert.ok(Array.isArray(await db.selectNodes()));
  const blocks = await db.selectBlocks();
  assert.ok(blocks.length > 0);
  assert.ok(blocks[0].time_stamp instanceof Date);
  assert.equal(typeof blocks[0].ch_hash, 'object');
  for (const original of blocks) {
    const fields = await db.selectBlockbyNumber_NoblockHash(original.block_number);
    assert.equal(db.sha3_256_FromJson(JSON.stringify(fields)), original.block_hash);
  }
  const block = await db.selectFullBlockbyID(blocks[0].block_number);
  assert.ok(Array.isArray(block));
  assert.match((await db.getCuckooFilterHash()).hash, /^[a-f0-9]{64}$/);
  assert.equal((await db.getCuckooFilterHash()).hash, blocks.at(-1).cuckoofilter_hash);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE blocks SET parent_hash = ? WHERE block_number = ?', ['rollback-test', blocks[0].block_number]);
    assert.equal((await conn.query('SELECT parent_hash FROM blocks WHERE block_number = ?', [blocks[0].block_number]))[0][0].parent_hash, 'rollback-test');
    let completed = false;
    const waiting = pool.query('SELECT parent_hash FROM blocks WHERE block_number = ?', [blocks[0].block_number]).then(result => { completed = true; return result; });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(completed, false);
    await conn.rollback();
    assert.equal((await waiting)[0][0].parent_hash, blocks[0].parent_hash);
  } finally { conn.release(); }

  const users = Array.from({ length: 8 }, (_, i) => `sqlite-test-${process.pid}-${i}`);
  const results = await Promise.all(users.map(user => db.cfInsert(user)));
  assert.ok(results.every(result => result.inserted));
  const reader = await pool.getConnection();
  try {
    for (const user of users) assert.equal((await db.cfContains(reader, user)).exists, true);
    assert.equal((await db.cfInsert(users[0])).alreadyPresent, true);
    for (const user of users) assert.equal((await db.cfDelete(user)).deleted, true);
    for (const user of users) assert.equal((await db.cfContains(reader, user)).exists, false);
  } finally { reader.release(); }
});

test('API: rotas consultam SQLite e excluem dados do filtro sem erro', async () => {
  const express = require('express');
  const listen = express.application.listen;
  let server;
  express.application.listen = function () {
    server = listen.call(this, 0, '127.0.0.1');
    return server;
  };
  try { require('./index'); } finally { express.application.listen = listen; }
  try {
    if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const route of ['/nodes', '/blocks', '/cuckoo/health']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200, route);
      await response.json();
    }
    const response = await fetch(base + '/cuckoo/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_data: 'sqlite-http-test' }),
    });
    assert.equal(response.status, 200);
    assert.equal(typeof (await response.json()).deleted, 'boolean');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

// Fecha o arquivo antes da remoção no Windows.
after(async () => {
  await pool.end();
  fs.rmSync(temporary, { recursive: true, force: true });
});
