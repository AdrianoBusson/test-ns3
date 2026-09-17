 
'use strict';

require("dotenv").config();
 
const express = require('express');
const app = express();
//const { ethers } = require('ethers');
const port = process.env.PORT;


const db = require("./db");
const crypto = require("crypto");
//const hash = require("./hash3");
//const hash_new = require("./hash_new");
const cuckoo = require("./cuckoofilter");
//const hashsha = crypto.createHash('sha256');

const camhash = require("./hash"); // Camaleon Hash baseado em Ateniense e Medeiros

const pool = require('./sqlite');
 
app.use(express.json());
 
global.origin_node = {
    origin_node_id: 1,
    address: "0xd5814BAc43040Fa562e86C76BBa42C653d9f6631",
    publicKey: "0x04f23fc380707c885c33538961525f54981d8f451b4c88e08f4865704c0f502018f1af836223d14ea7783d4fbdda1ca34203e29ebc972e3345dc50d4c82e588cae"
};

global.sealer_node = {
    sealer_node_id: 1,
    address: "0xd5814BAc43040Fa562e86C76BBa42C653d9f6631",
    publicKey: "0x04f23fc380707c885c33538961525f54981d8f451b4c88e08f4865704c0f502018f1af836223d14ea7783d4fbdda1ca34203e29ebc972e3345dc50d4c82e588cae"
};


//-------------------

function sha3_256_FromJson(jsonData) {
    // Converte para string de forma determinística
    const jsonString = typeof jsonData === "string"
        ? jsonData
        : JSON.stringify(jsonData);

    // Calcula o SHA3-256
    const hash = crypto
        .createHash("sha3-256")
        .update(jsonString)
        .digest("hex");

    return hash;
}
 
app.get('/nodes', async (req, res) => {
    try {
        const results = await db.selectNodes();

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});

app.get('/nodebyid/:id', async (req, res) => {
    try {
        const results = await db.selectNodebyid(req.params.id);

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});

app.get('/blocks', async (req, res) => {
    try {
        const results = await db.selectBlocks();

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }
        
        return res.json(results);  // ← RESPOSTA QUANDO HÁ BLOCO

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar blocos.' });
    }
});

app.get('/blockscount', async (req, res) => {
    try {
        const results = await db.blockscount();

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }
        
        return res.json(results);  // ← RESPOSTA QUANDO HÁ BLOCO

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar blocos.' });
    }
});

app.post('blockpage', async (req, res) => {
    try {
        const results = await db.selectBlocksPage(req.body.limit, req.body.offset);

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});


app.get('/lastblock', async (req, res) => {
    try {
        const results = await db.selectBlockslast();

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});




app.post('/calcblockhash', async (req, res) => {
    try {
        console.log("BODY RECEBIDO NO CALCBLOCKHASH:", req.body.block_number);
        //const results = await db.selectBlockbyNumber_NoblockHash(req.body.block_number);
        const results = await db.calcblockhash(req.body.block_number);
        console.log("HASH CALCULADO DO BLOCO:", results);
        if (results.length === 0) {
            return res.json({ message: 'Erro!' });
        }

        return res.json({"block": req.body.block_number, "Hash": results});  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});

app.get('/lastFullblock', async (req, res) => {
    try {
        const results = await db.selectFullBlockslast();

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});

app.post('/user/fullblockbyID', async (req, res) => {
    try {
        const results = await db.selectFullBlockbyID(req.body.block_number);

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});

app.post('/user/verifyBlockbyID', async (req, res) => {
    try {
        const results = await db.verifyBlockbyID(req.body.block_number);

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});

app.post('/user/blockbyID', async (req, res) => {
    try {
        const results = await db.BlockbyID(req.body.block_number);

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});

app.post('/user/blockslimit', async (req, res) => {
    try {
        const results = await db.selectblockslimit(req.body.blocks);

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});


app.get('/lastblockhash', async (req, res) => {
    try {
        const results = await db.selectBlockslastblock_hash();

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});


app.get('/user/lastblockID', async (req, res) => {
    try {
        const results = await db.lastblocksID();

        if (results.length === 0) {
            return res.json({ message: 'Nenhum node encontrado!' });
        }

        return res.json(results);  // ← RESPOSTA QUANDO HÁ NODES

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar nodes.' });
    }
});


app.get('/hash_sha_256', (req, res) => {
    //const hash = crypto.createHash('sha256')
    console.log("REQ BODY:", req.body);
    //hash.update(req.body.data || 'Hello, world!')
    const hash = hash.sha3_256_FromJson(req.body)
    //result = hash.update(JSON.stringify(req.body)).digest('hex');
    console.log("hash:", hash);
    return res.json({ hash});
});
 


// // Exemplo de uso:
// const data = {
//     from: "Alice",
//     to: "Bob",
//     amount: 50
// };


//cuckoo filter

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // MySQL/BigInt: serialize como string
    if (typeof value === 'bigint') return value.toString();

    // corta ciclos
    if (value && typeof value === 'object') {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  });
}

function safeJson(res, status, payload) {
  try {
    const s = safeStringify(payload);
    res.status(status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(s); // send string, não res.json
  } catch (e) {
    // fallback final: nunca serialize "payload" aqui
    res.status(500);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(JSON.stringify({
      error: 'Falha ao serializar resposta.',
      detail: e.message
    }));
  }
}

function requireUserData(req, res) {
  const ud = req.body?.user_data;
  if (ud === undefined) {
    res.status(400).json({ error: 'Campo obrigatório: user_data (JSON).' });
    return null;
  }

  // Normaliza para JSON "puro" e elimina qualquer referência inesperada
  // (se houver ciclo, falha aqui com mensagem do próprio JSON.stringify)
  try {
    return JSON.parse(JSON.stringify(ud));
  } catch (e) {
    const cyc = findCircularPath(ud);
    res.status(400).json({
      error: `user_data deve ser JSON serializável. Detalhe: ${e.message}`,
      circular_path: cyc || null,
    });
    return null;
  }
}

function findCircularPath(obj) {
  const seen = new WeakMap(); // obj -> path
  function walk(v, path) {
    if (!v || typeof v !== 'object') return null;
    if (seen.has(v)) return `${seen.get(v)} -> ${path}`;
    seen.set(v, path);

    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        const r = walk(v[i], `${path}[${i}]`);
        if (r) return r;
      }
    } else {
      for (const k of Object.keys(v)) {
        const r = walk(v[k], `${path}.${k}`);
        if (r) return r;
      }
    }
    return null;
  }
  return walk(obj, '$');
}

app.post('/cuckoo/insert', async (req, res) => {
  const userData = requireUserData(req, res);
  if (!userData) return;

  //const conn = await pool.getConnection();
  try {
    const r = await db.cfInsert(userData);
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    //conn.release();
  }
  
});


app.post('/cuckoo/delete', async (req, res) => {
  const userData = requireUserData(req, res);
  if (!userData) return;

  
  try {
    const r = await db.cfDelete(userData);
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/cuckoo/health', async (_req, res) => {
  const conn = await pool.getConnection();
  try {
    const meta = await db.getActiveFilterMeta(conn);
    res.json({ ok: true, active_filter: meta });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    conn.release();
  }
});

app.post('/cuckoo/contains', async (req, res) => {
  const userData = requireUserData(req, res);
  if (!userData) return;

  const conn = await pool.getConnection();
  try {
    const r = await db.cfContains(conn, userData);
    return safeJson(res, 200, r);
  } catch (e) {
    return safeJson(res, 500, { error: e.message, stack: e.stack });
  } finally {
    conn.release();
  }
});

app.get('/cuckoo/hash', async (_req, res) => {
  //const conn = await pool.getConnection();
  try {
    var hashresult = await db.CheckCuckooFilterHash();
     res.status(200).json({ Sucess: hashresult.Sucess, hash: hashresult.hash, Valid: hashresult.valid, message: hashresult.message, erro: hashresult.error });

    //const meta = await db.getActiveFilterMeta(conn);
    //res.json({ ok: true, active_filter: meta });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  } //finally {
    //conn.release();
  //}
});
//POIU
app.post('/cuckoo/checkrighttobeforgoten', async (req, res) => {
  //console.log("BODY RECEBIDO NO /cuckoo/checkrighttobeforgoten:", req.body);

  const userData = requireUserData(req, res);
  if (!userData) return;
  const conn = await pool.getConnection();
  try {
    const r = await db.cfcheckrighttobeforgoten(conn, userData);
    return safeJson(res, 200, r);
  } catch (e) {
    return safeJson(res, 500, { sucess: e.sucess, message_pt: e.message_pt, message_en: e.message_en, stack: e.stack });
  } finally {
    conn.release();
  }
});


//console.log(`Node Origin: `, global.origin_node.origin_node_id);
//console.log(`Node Sealer: `, global.sealer_node.sealer_node_id);


//!@#---------------------------------------------
// hash camaleão versão Anteniese/Medeiros

app.post('/user/chamkeygen', async (req, res) => {
  try {

    const bits = typeof req.body.bits === 'number' ? req.body.bits : 128;

    if (Number.isNaN(bits) || bits <= 0) {
      return res.status(400).json({ error: 'Parâmetro "bits" deve ser um inteiro positivo.' });
    }

    // Limites razoáveis para evitar custos absurdos (ajuste conforme sua necessidade)
    if (bits < 32 || bits > 1024) {
      return res.status(400).json({
        error: 'Parâmetro "bits" fora do intervalo permitido (32–1024).'
      });
    }

    const { publicKey, privateKey } = camhash.generateKeys(bits);    

    console.log("Chaves geradas de " + bits + " bits ...");
    console.log("Public Key:", publicKey);
    console.log("Private Key:", privateKey);  

    res.json({publicKey, privateKey});
  } catch (err) {
    console.error('Erro em /user/chamkeygen:', err);
    res.status(500).json({ error: 'Erro interno ao gerar parâmetros.' });
  }
});

app.post('/user/chamhash', (req, res) => {
   try {
    const { publicKey, infodata } = req.body;
    if (!publicKey || !infodata) {
      return res.status(400).json({
        ok: false,
        error: 'Corpo inválido: é necessário "publicKey" e "message".'
      });
    }

    console.log("Gerando hash camaleão para a mensagem:", infodata);

    const hash = camhash.chameleonHash(publicKey, infodata);

       
    console.log("Hash gerado:", hash);

    res.json({
      ok: true,
      xp: {
        r: hash.r,
        s: hash.s
      },
      hash: hash.hash
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/chamverify', (req, res) => {

  try {
    console.log("REQ BODY:", req.body);
    const { publicKey, hash, infodata, xp } = req.body;
    console.log("Verificando hash camaleão para a mensagem:", infodata);
    console.log("Public Key:", publicKey);
    console.log("Hash fornecido:", hash);
    console.log("r:", xp?.r);
    console.log("s:", xp?.s);
    if (!publicKey || !hash || !infodata || !xp.r || !xp.s) {
      return res.status(400).json({
        ok: false,
        error: 'Corpo inválido: "publicKey", "hash", "infodata", "xp.r" e "xp.s" são obrigatórios.'
      });
    }
   
    const valid = camhash.verifyChameleonHash(publicKey, hash, infodata, xp.r, xp.s);
    res.json({
      hash: hash,
      valid: valid
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});




app.post('/addnewdatauser', async (req, res) => {
  //console.log("BODY RECEBIDO NO /addnewdatauser:", req.body);
    const retorno = await db.addNewDataUser(req.body);
    console.log("RETORNO DE addNewDataUser:", retorno);
    if (retorno.exist) {
        return res.status(409).json({  
            exist: retorno.exist, 
            message: retorno.message
        });
    } else if (retorno.valid === false ) {
        return res.status(400).json({  // Sai da função sem inserir
            error: 'Assinatura inválida.',
            detail: retorno.validsignature.error,
            message: retorno.message
        });
    }

    return res.status(201).json({
        sucesso: retorno.sucesso,
        message: retorno.message,        
        blockData: retorno.blockData,
        block_hash: retorno.block_hash,
      
    });
   
});

app.post('/user/chamchcollision', (req, res) => {
  try {
    //console.log("REQ BODY:", req.body);
    
    const { publicKey, privateKey, hash, newInfodata } = req.body;
    if (!publicKey || !privateKey || !hash || !newInfodata) {
      return res.status(400).json({
        ok: false,
        error: 'Corpo inválido: "publicKey", "privateKey", "hash" e "newInfodata" são obrigatórios.'
      });
    }
   
    
    if (!publicKey.p || !publicKey.q || !publicKey.g || !publicKey.y) {
      return res.status(400).json({
        ok: false,
        error: 'Campos "p", "q", "g" e "y" são obrigatórios em "publicKey".'
      });
    }

    const h2 = camhash.generateCollision(
    publicKey,
    privateKey,
    hash,
    newInfodata);

    console.log("New Infodata:", newInfodata);
    
    const valid = camhash.verifyChameleonHash(publicKey, h2.hash, newInfodata, h2.r, h2.s);
    if (!valid) {
      return res.status(500).json({
        ok: false,
        error: 'Falha ao gerar colisão válida. Verificação falhou.',
        valid:false
      });
    }

    res.json({
      ok: true,
      hash: h2.hash,
      xp: {
        r: h2.r,
        s: h2.s},
        valid: hash===h2.hash
      });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/updateuserdata', async (req, res) => {
  console.log("BODY RECEBIDO NO /updateuserdata:", req.body);
    const retorno = await db.updateuserdata(req.body);
    console.log("RETORNO DE updateuserdata:", retorno);

    if (retorno.exist) {
        return res.status(404).json({  
            exist: retorno.exist, 
            message: retorno.message
        });
    } else if (retorno.valid === false ) {
        return res.status(400).json({  // Sai da função sem inserir
            error: 'Assinatura inválida.',
            //detail: retorno.validsignature.error,
            detail: retorno.detail,
            message: retorno.message,
            error: retorno.error
        });
    }

    return res.status(201).json({
        sucesso: retorno.sucesso,
        exit: retorno.exit,
        message: retorno.message,
        detail: retorno.detail        
        //blockData: retorno.blockData
        //block_hash: retorno.block_hash,
      
    });
   

   
});


//----------------------------------------------------


app.use((req, res, next) => {
  const oldJson = res.json.bind(res);

  res.json = (obj) => {
    try {
      JSON.stringify(obj);
    } catch (e) {
      console.error('RES.JSON payload circular. Endpoint:', req.method, req.originalUrl);
      // cuidado: não faça JSON.stringify(obj) de novo aqui
      return res.status(500).type('application/json').send(JSON.stringify({
        error: 'res.json recebeu payload circular',
        detail: e.message,
      }));
    }
    return oldJson(obj);
  };

  next();
});



//app.get('/', (req, res) => res.json({ message: 'Node 0 - Acesse /nodes para listagem de Nodes!!' }));
app.get('/', (req, res) => res.json({ message: 'Editable Blockchain Up and Runing. By Adriano Busson',
  list_blocks: 'http://localhost:3000/blocks',
  last_block: 'http://localhost:3000/lastblock',
  last_full_block: 'http://localhost:3000/lastFullblock',
  last_block_hash: 'http://localhost:3000/lastblockhash',
  last_block_id : 'http://localhost:3000/user/lastblockID',
  cuckoo_filter_status: 'http://localhost:3000/cuckoo/hash',
  last_block_limit: 'http://localhost:3000/user/blockslimit {blocks: 10}',
  last_block_by_id: 'http://localhost:3000/user/blockbyID {block_number: 1}',
  last_full_block_by_id: 'http://localhost:3000/user/fullblockbyID {block_number: 1}',
  verify_block_by_id: 'http://localhost:3000/user/verifyBlockbyID {block_number: 1}',
   generate_chameleon_hash_keys: 'http://localhost:3000/user/chamkeygen {bits: 128}',
  

 }));
//inicia o servidor
app.listen(port);
console.log('API OK!');
console.log(`http://localhost:${port}/`);