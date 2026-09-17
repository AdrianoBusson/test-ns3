
// pacote requerido pelo cuckoo filter
// npm i fast-json-stable-stringify

require("dotenv").config();

const pool = require('./sqlite');
//const hash = require("./hash3");
//const { ethers } = require('ethers');
const crypto = require("crypto");

const camhash = require("./hash"); // Camaleon Hash baseado em Ateniense e Medeiros


// Cache de metadados do filtro ativo
const FILTER_CACHE_TTL_MS = 2000;
/** @type {{id:number,numBuckets:number,mask:number,maxKicks:number,bucketSize:number,fpBits:number,cachedAt:number} | null} */
let cachedFilter = null;




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
 
// NODES ----------------------------
async function selectNodes() {
    const res = await pool.query('SELECT * FROM nodes');
    return res[0];
 
}
async function selectNodebynode(Node) {
    const res = await pool.query('SELECT * FROM nodes WHERE node_address=?', [Node]);
    return res[0];
}

//async function selectNode(Node) {
    //const res = await pool.query('SELECT * FROM blocks WHERE node=?', [Node]);
    //return res[0];
//}


async function selectNodebyid(id) {
    const res = await pool.query('SELECT * FROM nodes WHERE node_id=?', [id]);
    return res[0];
}

async function selectNodebypb_key(pb_key) {
    const res = await pool.query('SELECT * FROM nodes WHERE node_pb_key=?', [pb_key]);
    return res[0];
}

// Incluir Node
async function insertNode(node) {
    //console.log("BODY RECEBIDO:", node.body); 
    const sql = 'INSERT INTO nodes(node_level,node_address,node_pb_key,node_ip) VALUES (?,?,?,?);';
    const values = [node.level, node.node, node.pb_key, node.ip];
    console.log("VALUES:", values);
    //await pool.query(sql, values);
}


 

// Address -------------------------------------
 

// Blocks -------------------------------------
async function selectBlocks() {
    const res = await pool.query('SELECT * FROM blocks;');
    //console.log("RESULTS BLOCO:", res[0]);
        return res[0];
 
}

async function blockscount() {
    const res = await pool.query('SELECT COUNT(*) as count FROM blocks;');
    //console.log("RESULTS BLOCO:", res[0]);
        return res[0];
 
}

async function selectblockslimit(blocks) {
    const res = await pool.query('SELECT * FROM blocks ORDER BY block_number DESC LIMIT ' + blocks + ';');
    //console.log("RESULTS BLOCO:", res[0]);
        return res[0];
 
}

async function lastblocksID(blocks) {
    const res = await pool.query('SELECT block_number FROM blocks ORDER BY block_number DESC LIMIT 1;');
    //console.log("RESULTS BLOCO:", res[0]);
        return res[0];
 
}

// seleciona uma lista de blocos para paginação @@@@@@@@@@@@@@@@@@@@@@@@@@@@$$$$$$$$$$$$$$$$$$
async function selectBlocksPage(limit, offset) {
  try {
          const res = await pool.query(`SELECT * FROM blocks LIMIT ` + limit + ` OFFSET ` + offset + `;`);
    console.log("BLOCK RECEBIDO:", res[0][0]);
    //console.log("HASH RECEBIDO:",res[0][0].block_hash); 
    return res[0];  
  } catch (error) {
    console.error("Erro ao selecionar bloco por ID:", error);
    return {
      error: "Erro interno: Falha ao selecionar bloco por ID",
      detail: error.message,
      message: "Ocorreu um erro ao selecionar o bloco pelo ID fornecido."

    
  }

 
}
}


// seleciona o último bloco incluindo block_hash
async function selectFullBlockslast() {
        const res = await pool.query(`SELECT 
B.block_number, B.time_stamp, B.parent_hash,  
O.node_id AS origin_id, O.node_level AS origin_level, S.node_address AS origin_address, S.node_pb_key AS origin_pb_key,
S.node_id AS sealer_id, S.node_level AS sealer_level, S.node_address AS sealer_address, S.node_pb_key AS sealer_pb_key,
D.userdata_id, D.userdata_address,D.userdata_pb_key, D.infodata, B.ch_hash, B.block_hash, B.cuckoofilter_hash, B.userdata_id_hash
FROM blocks as B
INNER JOIN userdata as D ON B.userdata_address=D.userdata_address 
INNER JOIN nodes as S ON B.sealer_node_id=S.node_id
INNER JOIN nodes as O ON B.sealer_node_id=O.node_id
ORDER BY block_number DESC LIMIT 1; `);
    console.log("LAST BLOCK RECEBIDO:", res[0][0]);
    //console.log("HASH RECEBIDO:",res[0][0].block_hash); 
    return res[0];
 
}


// seleciona o último bloco incluindo block_hash
async function selectFullBlockbyID(block_number) {
  try {
          const res = await pool.query(`SELECT 
B.block_number, B.time_stamp, B.parent_hash,  
O.node_id AS origin_id, O.node_level AS origin_level, S.node_address AS origin_address, S.node_pb_key AS origin_pb_key,
S.node_id AS sealer_id, S.node_level AS sealer_level, S.node_address AS sealer_address, S.node_pb_key AS sealer_pb_key,
D.userdata_id, D.userdata_address,D.userdata_pb_key, D.infodata, B.ch_hash, B.block_hash, B.cuckoofilter_hash, B.userdata_id_hash
FROM blocks as B
INNER JOIN userdata as D ON B.userdata_address=D.userdata_address 
INNER JOIN nodes as S ON B.sealer_node_id=S.node_id
INNER JOIN nodes as O ON B.sealer_node_id=O.node_id
WHERE B.block_number = ?
ORDER BY block_number DESC LIMIT 1; `, [block_number]);
    console.log("BLOCK RECEBIDO:", res[0][0]);
    //console.log("HASH RECEBIDO:",res[0][0].block_hash); 
    return res[0];  
  } catch (error) {
    console.error("Erro ao selecionar bloco por ID:", error);
    return {
      error: "Erro interno: Falha ao selecionar bloco por ID",
      detail: error.message,
      message: "Ocorreu um erro ao selecionar o bloco pelo ID fornecido."

    
  }

 
}
}
//!!!!



//QWERTYU
async function verifyBlockbyID(block_number) {

  
  console.log("Verificando bloco pelo ID:", block_number);
    var blocknoblockhash = await calcblockhash(block_number);

    const res = await pool.query(`SELECT block_number, block_hash, parent_hash FROM blocks 
        WHERE block_number = ${block_number};`);
    //console.log("HASH RECEBIDO:",res[0][0].block_hash); 

    console.log("Hash calculado do bloco: " + block_number + " - " + blocknoblockhash);
    console.log("Hash armazenado no banco de dados do bloco: " + block_number + " - " + res[0][0].block_hash);
    // if (blocknoblockhash !== res[0][0].block_hash) {
    //   console.log("block hash do bloco " + block_number + " não corresponde ao hash calculado. Bloco inválido.");
    // }
    //   return { valid: false, message: "block hash do bloco " + block_number + " não corresponde ao hash calculado. Bloco inválido." };
    //   else {
    //     console.log("block hash do bloco " + block_number + " corresponde ao hash calculado. Bloco válido.");
    //     return {valid: true, message: "block hash do bloco " + block_number + " corresponde ao hash calculado. Bloco válido." };
    //   }

    if (blocknoblockhash !== res[0][0].block_hash) {
      console.log("block hash do bloco " + block_number + " não corresponde ao hash calculado. Bloco inválido.");
      return { valid: false, message: "The blockle hash of block " + block_number + " does not match the calculated hash. Invalid block. - " + "block hash do bloco " + block_number + " não corresponde ao hash calculado. Bloco inválido." };
    } 
    // else {
    //   console.log("block hash do bloco " + block_number + " corresponde ao hash calculado. Bloco válido.");
    //   return { valid: true, message: "The blockle hash of block " + block_number + " matches the calculated hash. Valid block. - " +  "block hash do bloco " + block_number + " corresponde ao hash calculado. Bloco válido."};
    // }

    if (block_number == 0) {
      return { valid: true, message: "The blockle hash of block 0 matches the calculated hash. Valid block. - " +  "block hash do bloco 0 corresponde ao hash calculado. Bloco válido."};
console.log("Hash do bloco " + block_number + ": " + blocknoblockhash);    
console.log("block hash do bloco " + block_number + " corresponde ao hash calculado. Bloco válido.");
    }

    var previoousblocknoblockhash = await calcblockhash(block_number - 1);
    console.log("Hash calculado do bloco anterior " + (block_number - 1) + ": " + previoousblocknoblockhash);
    console.log("Hash do bloco anterior " + (block_number - 1) + ": " + res[0][0].parent_hash);

if (res[0][0].parent_hash !== previoousblocknoblockhash) {
    console.log("Parent hash do bloco " + block_number + " não corresponde ao hash do bloco anterior. Bloco inválido.");
    return { valid: false, message: "The parent hash of block " + block_number + " does not match the hash of the previous block. Invalid block." };
}
return { valid: true, message: "The block " + block_number + " matches the calculated hash and the previous block hash. Valid block. - " +  "O bloco " + block_number + " corresponde ao hash calculado e ao hash do bloco anterior. Bloco válido."};
}

// seleciona um bloco por ID
async function BlockbyID(block_number) {
  try {
          const res = await pool.query('SELECT * FROM blocks WHERE block_number = ' + block_number + ';');
    console.log("BLOCK RECEBIDO:", res[0][0]);
    //console.log("HASH RECEBIDO:",res[0][0].block_hash); 
    return res[0];  
  } catch (error) {
    console.error("Erro ao selecionar bloco por ID:", error);
    return {
      error: "Erro interno: Falha ao selecionar bloco por ID",
      detail: error.message,
      message: "Ocorreu um erro ao selecionar o bloco pelo ID fornecido."

    
  }

 
}
}


// seleciona o último bloco sem o block_hash
async function selectBlockslast() {
    const res = await pool.query(`SELECT 
B.block_number, B.time_stamp, B.parent_hash,  
O.node_id AS origin_id, O.node_level AS origin_level, S.node_address AS origin_address, S.node_pb_key AS origin_pb_key,
S.node_id AS sealer_id, S.node_level AS sealer_level, S.node_address AS sealer_address, S.node_pb_key AS sealer_pb_key,
D.userdata_id, D.userdata_address,D.userdata_pb_key, D.infodata, B.ch_hash, B.cuckoofilter_hash, B.userdata_id_hash
FROM blocks as B
INNER JOIN userdata as D ON B.userdata_address=D.userdata_address 
INNER JOIN nodes as S ON B.sealer_node_id=S.node_id
INNER JOIN nodes as O ON B.sealer_node_id=O.node_id
ORDER BY block_number DESC LIMIT 1; `);
    console.log("LAST BLOCK RECEBIDO:", res[0][0]);
    //console.log("HASH RECEBIDO:",res[0][0].block_hash); 
    return res[0];
 
}

// seleciona o block_hash do último bloco
async function selectBlockslastblock_hash() {
    const res = await pool.query(`SELECT block_number, block_hash FROM blocks 
        ORDER BY block_number DESC LIMIT 1;`);
    //console.log("HASH RECEBIDO:",res[0][0].block_hash); 
    return res[0];
 
}


//Retorna bloco completo pelo block_number
async function selectBlockbyNumber(block_number) {

try {
var res = await pool.query(`SELECT
block_number, parent_hash, time_stamp, sealer_node_id, origin_node_id,  ch_hash, userdata_address, block_hash, cuckoofilter_hash
FROM blocks
WHERE block_number = ?;`, [block_number]);
    return res[0];
 
} catch (error) {
    console.error("Erro ao selecionar bloco por número:", error);
    return {
      error: "Erro interno: Falha ao selecionar bloco por número",
      detail: error.message,
      message: "Ocorreu um erro ao selecionar o bloco pelo número fornecido."
       
}

}

}


// Retona bloco pelo block_number
async function selectBlockbyNumber_NoblockHash(block_number) {

try {
var res = await pool.query(`SELECT
block_number, parent_hash, time_stamp, sealer_node_id, origin_node_id,  ch_hash, userdata_address, cuckoofilter_hash, userdata_id_hash
FROM blocks
WHERE block_number = ?;`, [block_number]);
    return res[0];
 
} catch (error) {
    console.error("Erro ao selecionar bloco por número:", error);
    return {
      error: "Erro interno: Falha ao selecionar bloco por número",
      detail: error.message,
      message: "Ocorreu um erro ao selecionar o bloco pelo número fornecido."
       
}

}

}

async function calcblockhash(block) {
  var blockData = await selectBlockbyNumber_NoblockHash(block);
  console.log("BLOCO RECUPERADO PARA CALCULAR HASH:", JSON.stringify(blockData));
    return sha3_256_FromJson(JSON.stringify(blockData));
}

//verifica validade do cuckoo filter hash com o último bloco inserido PAPA
async function isvalideCuckooFilterHash() {
  var HashCuckooFilter = await getCuckooFilterHash(); 
  var lastBlock_hashCuckooFilter = await pool.query(`SELECT cuckoofilter_hash FROM blocks 
        ORDER BY block_number DESC LIMIT 1;`);
    console.log("HASH DO CUCKOO FILTER ATUAL:", HashCuckooFilter.hash);
    console.log("HASH DO CUCKOO FILTER DO ÚLTIMO BLOCO INSERIDO:", lastBlock_hashCuckooFilter[0][0].cuckoofilter_hash);
    console.log("HASH COMPARADO:", lastBlock_hashCuckooFilter[0][0].cuckoofilter_hash == HashCuckooFilter.hash); 
    //return res[0];
  if (lastBlock_hashCuckooFilter[0][0].cuckoofilter_hash == HashCuckooFilter.hash) {
    //console.log("Sucess:", HashCuckooFilter.Suscess);
    console.log("Cuckoo filter hash válido para o último bloco inserido.");
    return true;
  }
  console.log("Blockchain violation: O hash do Cuckoo filter e do último bloco inserido não correspondem");
  return false;
}

// Incluir datauser e criar bloco
async function addNewDataUser(newinfo) {
    
try {
  console.log("Verificando ch_hash do novo bloco...");

  console.log("Dados para verificação do ch_hash:", {
    publickKey: newinfo.tx.ch_hash.publicKey,
    hash: newinfo.tx.ch_hash.hash,
    message: newinfo.tx.infodata.message,
    xp: newinfo.tx.ch_hash.xp
  });

  //verifyChameleonHash(publicKey, h1.hash, h1.message, h1.r, h1.s)
  //const valid = camhash.verifyChameleonHash(publicKey, hash, message, xp.r, xp.s);
  var chashisvalid = camhash.verifyChameleonHash(
    newinfo.tx.ch_hash.publicKey, 
    newinfo.tx.ch_hash.hash,
    newinfo.tx.infodata.message, 
    newinfo.tx.ch_hash.xp.r, 
    newinfo.tx.ch_hash.xp.s);  
    console.log("Validação do ch_hash do novo bloco:", chashisvalid);

    if (!chashisvalid) {
        console.error("Chameleon hash inválido para os dados fornecidos."); 
        return{  valid : false,
          error: 'Falha ao verificar ch_hash.',
          message: 'Chameleon hash inválido para os dados fornecidos.',
          detail: "Os dados fornecidos não correspondem ao ch_hash fornecido."}

        }
} catch (error) {
  return{  valid : false,
    error: 'Erro interno: Falha ao verificar ch_hash.',
    message: 'Ocorreu um erro ao verificar o ch_hash dos dados fornecidos.',
    detail: error.message}

  
}
console.log("Chameleon hash válido para os dados fornecidos. Prosseguindo...", chashisvalid);

    // checa se usuário já existe
    const sqlCheck = `SELECT userdata_id, userdata_address
    FROM userdata 
    WHERE userdata_id = ? OR userdata_address = ?;`;
    console.log("Checando se usuário existe... ",newinfo.tx.userdata_id, newinfo.tx.ch_hash.hash,);
    const sqlChecked = await pool.query(sqlCheck, [newinfo.tx.userdata_id, newinfo.tx.ch_hash.hash]);            
    console.log("Checando se usuário existe...", sqlChecked[0]);
    ////await pool.query(sqlCheck, sqlChecked);
    if (sqlChecked[0].length > 0) {
        console.log("Usuário já existe:", sqlChecked[0][0]);
        return{
          error: "Usuário já existe",
          exist : true,
          code : "409", 
          message : "Já existe um registro com o mesmo ID ou endereço - Utilize outra trapdoor."}
   
    }   
    
    console.log("Usuário não existe. Prosseguindo para inserção...");
    // Insere novo usuário
    

    //Retorna o último userdata_number da rede
     try {
      var lastUserDataNumber = await pool.query(`SELECT data_number FROM userdata ORDER BY data_number DESC LIMIT 1;`);
      console.log("RETORNO lastUserDataNumber:", lastUserDataNumber);
    } catch (error) {
      console.error("Erro ao obter o último userdata_number:", error);
      return {error: "Erro interno: Falha ao obter o último userdata_number"};
    }
   
    // Checa se o hash do Cuckoo filter é válido com o último bloco inserido
    var CuckooFilterHashisvalid = await isvalideCuckooFilterHash();

   console.log("Cuckoofilter Válido:", CuckooFilterHashisvalid);

   if (!CuckooFilterHashisvalid) {
    console.error("O hash do Cuckoo filter e do último bloco inserido não correspondem. Blockchain violada.");
    return {error: "O hash do Cuckoo filter e do último bloco inserido não correspondem. Blockchain violada."};
   }


    // Retorna HASH do Cuckoo filter antes de inserir novo usuário
  console.log("Tentando recuperar o HASH do Cuckoo filter original...");
  var HashCuckooFilter_original = await getCuckooFilterHash(); 
  if (!HashCuckooFilter_original.Sucess) {
    console.log("Sucess:", HashCuckooFilter_original.Suscess);
    console.log("Erro interno 3: Erro ao adicionar novo usuário ao filtro:")
    return {error: "Erro interno 3: Falha ao recuperar o HASH do Cuckoo filter"};
  }

  console.log("HASH do Cuckoo filter original:", HashCuckooFilter_original.hash);


    // Adiciona novo usuário ao CuckooFilter
  try {
    console.log("Adicionando novo usuário ao filtro: ", newinfo.tx.userdata_id);
    
    var CuckoofilterInserted = await cfInsert(String(newinfo.tx.userdata_id));

    if (CuckoofilterInserted.failed) {
      console.error("Erro interno1:Falha ao adicionar novo usuário ao filtro.");
      return {error: "Erro interno1: Falha ao adicionar novo usuário ao filtro"};
    }

      if (CuckoofilterInserted.alreadyPresent) {
       console.log("Usuário já existe no filtro:", CuckoofilterInserted);
      // return {
      //   sucesso: true,
      //   message: "Usuário já existe no filtro:",
      //     blockNumber: parseInt(last_block_hash[0].block_number) + 1,
      //     //blockData: lastblock[0]
      //   }
      }
    
          if (CuckoofilterInserted.inserted) {
       console.log("Novo usuário inserido no filtro com sucesso:", CuckoofilterInserted);
      // return {
      //   sucesso: true,
      //   message: "Novo usuário inserido no filtro com sucesso.",
      //     //blockNumber: parseInt(last_block_hash[0].block_number) + 1,
      //     //blockData: lastblock[0]
      //   }
      }

  } catch (error) {
    console.error("Erro interno 2: Erro ao adicionar novo usuário ao filtro:", error);
    return {error: "Erro interno 2 Falha ao adicionar novo usuário ao filtro",
    detail: error.message
    };

  }

  // Retorna HASH do Cuckoo filter do usuário novo inserido
  console.log("Tentando recuperar o HASH do Cuckoo filter do usuário novo inserido...");
  var HashCuckooFilter_new = await getCuckooFilterHash(); 
  if (!HashCuckooFilter_new.Sucess) {
    console.log("Sucess:", HashCuckooFilter_new.Suscess);
    console.log("Erro interno 3: Erro ao adicionar novo usuário ao filtro:")
    return {error: "Erro interno 3: Falha ao recuperar o HASH do Cuckoo filter"};
  }

  console.log("HASH do Cuckoo filter do usuário novo inserido:", HashCuckooFilter_new.hash);
 


    //Insere novo userdata
    try {
    var newdatausersql = `INSERT INTO 
    userdata(data_number,
    userdata_id,userdata_address,userdata_pb_key,infodata) 
    VALUES (?,?,?,?,?);`;
    console.log("Último userdata_number:", lastUserDataNumber[0][0].data_number);
    //console.log("NOVO USUÁRIO INFO:", parseInt(lastUserDataNumber[0][0].data_number) + 1,newinfo.tx.userdata_id,"-", newinfo.tx.userdata_address, "-", newinfo.tx.userdata_pb_key,"-", newinfo.tx.infodata);
    //var newdatauserValues = [parseInt(lastUserDataNumber[0][0].data_number) + 1, newinfo.tx.userdata_id, newinfo.tx.ch_hash.params.hk, newinfo.tx.userdata_pb_key, JSON.stringify(newinfo.tx.infodata)];
    var newdatauserValues = [parseInt(lastUserDataNumber[0][0].data_number) + 1, newinfo.tx.userdata_id, newinfo.tx.ch_hash.hash, newinfo.tx.ch_hash.hash, JSON.stringify(newinfo.tx.infodata)];
        console.log("NOVO USUÁRIO INFO:",newdatauserValues);
    await pool.query(newdatausersql, newdatauserValues);
    console.log("Novo usuário inserido:", newinfo.tx.userdata_id, newinfo.tx.ch_hash.hash);
      
    } catch (error) {
      console.error("Erro ao inserir novo usuário:", error);
      return {error: "Erro interno: Falha ao inserir novo usuário"};  
    }
    

    console.log("Usuário inserido com sucesso!");

    try {
       var last_block_hash = await selectBlockslastblock_hash();
        console.log("BODY RECEBIDO:",last_block_hash[0].block_hash); //OK
         //const block_hash =sha3_256_FromJson(block)
    console.log("block_hash do blocoanterior:", last_block_hash[0].block_hash);
    } catch (error) {
      console.error("Erro ao obter o hash do último bloco:", error);
      return {error: "Erro interno: Falha ao obter o hash do último bloco"};
    }

    try {
    var sql = `INSERT INTO blocks
    (block_number,parent_hash,origin_node_id,
    sealer_node_id,userdata_address,ch_hash,cuckoofilter_hash, userdata_id_hash, time_stamp) 
    VALUES (?,?,?,?,?,?,?,?,strftime('%Y-%m-%d %H:%M:%f', 'now'));`;
    var values = [parseInt(last_block_hash[0].block_number) + 1, 
    last_block_hash[0].block_hash, 
    global.origin_node.origin_node_id, 
    global.sealer_node.sealer_node_id,
    newinfo.tx.ch_hash.hash,   
    JSON.stringify(newinfo.tx.ch_hash),
    HashCuckooFilter_new.hash, 
    crypto.createHash('SHA3-256').update(newinfo.tx.userdata_id).digest('hex')];
    console.log("INSERINDO BLOCO...");
    console.log("Valores:", JSON.stringify(values));
    //console.log("VALUES:", values);
    //insere tudo menos o block_hash
    await pool.query(sql, values);
    console.log("BLOCO INSERIDO COM SUCESSO...");
    } catch (error) {
      console.error("Erro ao inserir novo bloco:", error);
      return {error: "Erro interno: Falha ao inserir novo bloco"};  
    }

  try {console.log("Tentando recuperar o bloco inserido para calcular o block_hash..."); 

      
    console.log("Bloco novo selecionado para calcular block_hash:", parseInt(last_block_hash[0].block_number) + 1);
   
    //console.log("Selecioando bloco para calcular block_hash");
    console.log("Bloco novo selecionado para calcular block_hash:", parseInt(parseInt(last_block_hash[0].block_number) + 1));
    var blocknoblockhash = await calcblockhash(parseInt(parseInt(last_block_hash[0].block_number) + 1));
    console.log("HASH CALCULADO DO BLOCO:", blocknoblockhash);

    //atualiza o block_hash do bloco inserido
    const updateSql = 'UPDATE blocks SET block_hash = ? WHERE block_number = ?;';
    const updateValues = [blocknoblockhash, parseInt(last_block_hash[0].block_number) + 1];
    console.log("UPDATE VALUES:", updateValues);
    console.log("ATUALIZANDO block HASH DO BLOCO...");
    await pool.query(updateSql, updateValues);
    console.log("block HASH ATUALIZADO COM SUCESSO.");

    


  } catch (error) {
    console.error("Erro ao recuperar o bloco inserido:", error);
    return {error: "Erro interno: Falha ao recuperar o o bloco inserido"};
  }

  try {

    var lastblock = await selectBlockbyNumber([parseInt(last_block_hash[0].block_number) + 1]);

    //console.log("BLOCO INSERIDO COM block_HASH ATUALIZADO:", lastblock[0]);

  } catch (error) {
    console.error("Erro ao recuperar o bloco inserido com block_hash atualizado:", error);
    return {error: "Erro interno: Falha ao recuperar o bloco inserido com block_hash atualizado"};

    
  }

   
console.log("Novo usuário adicionado e bloco " + lastblock[0] + " criado com sucesso.");
return { sucesso: true, message: "Novo usuário adicionado e bloco criado com sucesso.",
  blockNumber: parseInt(last_block_hash[0].block_number) + 1,
  blockData: lastblock[0]
  //block_hash: blocknoblockhash,
  //chHash: newinfo.tx.ch_hash

};
} 
   
//==================================================================================


// Verificador
function modPow(base, exp, mod) {
  if (mod === 1n) return 0n;
  let result = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) % mod;
    }
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}
function bigIntToHex(n) {
  if (n < 0n) {
    throw new Error('BigInt negativo não suportado em bigIntToHex');
  }
  return n.toString(16);
}
function sha256IntFromMessageAndR(messageHex, rBig) {
  let rHex = bigIntToHex(rBig);
  if (rHex.length % 2 === 1) {
    rHex = '0' + rHex;
  }
  const msgBuf = Buffer.from(messageHex, 'utf8'); // messageHex como ASCII, tal como message.encode() em Python
  const rBuf = Buffer.from(rHex, 'hex');
  const hashHex = crypto.createHash('sha256').update(msgBuf).update(rBuf).digest('hex');
  return BigInt('0x' + hashHex);
}
function chameleonHash(hkHex, pHex, qHex, gHex, messageHex, rHex, sHex) {
  const p = hexToBigInt(pHex);
  const q = hexToBigInt(qHex);
  const g = hexToBigInt(gHex);
  const hk = hexToBigInt(hkHex);
  const r = hexToBigInt(rHex);
  const s = hexToBigInt(sHex);

  const e = sha256IntFromMessageAndR(messageHex, r);
  const hke = modPow(hk, e, p);
  const gs = modPow(g, s, p);
  const tmp = (hke * gs) % p;

  let hashVal = (r - tmp) % q;
  if (hashVal < 0n) hashVal += q;

  // Retornamos BigInt; a representação em hex é feita na borda.
  return hashVal;
}
function hexToBigInt(hex) {
  if (typeof hex !== 'string') {
    throw new Error('Valor hexadecimal inválido');
  }
  let clean = hex.trim().toLowerCase();
  if (clean.startsWith('0x')) {
    clean = clean.slice(2);
  }
  if (clean === '') return 0n;
  return BigInt('0x' + clean);
}
function verifyChameleon(params, msgHex, rHex, sHex, expectedHashHex) {
  const expected = hexToBigInt(expectedHashHex);
  const computed = chameleonHash(
    params.hk,
    params.p,
    params.q,
    params.g,
    msgHex,
    rHex,
    sHex
  );
  return computed === expected;
}

// !@#$ atualiza bloco 
async function updateuserdata(newinfo) {

    //checa se assinatura de carteira é valida para o endereço fornecido
    console.log("Entrada em updateuserdata...");
    //console.log("BODY RECEBIDO:", newinfo);
    //console.log("userdata_address recebido:", newinfo.tx.userdata_address);
    //console.log("Signature recebida:", newinfo.tx.signature);
    //console.log("TX recebida:", newinfo.tx);

  

 
try {
console.log("Modo : ",newinfo.mode);
//console.log("Modo >1: ", (newinfo.mode>1));
//console.log("IF:", (newinfo.mode <0 || newinfo.mode >1) );
  //checa o modo de atualização (1 para atualização simples, 0 para exercício do direito ao esquecimento)
if (newinfo.mode <0 || newinfo.mode >1) 
  {
  console.error("Modo de atualização inválido. Deve ser 1 para atualização simples ou 0 para exercício do direito ao esquecimento.");
  return{  valid : false, sucesso: false, exit: 1,
    error: 'Falha ao verificar modo de atualização.',
    message: 'Modo de atualização inválido. Deve ser 1 para atualização simples ou 0 para exercício do direito ao esquecimento.',
    detail: "O campo 'mode' deve ser 1 ou 0."}
}

  console.log("Verificando ch_hash do novo bloco...");

  console.log("Dados para verificação do ch_hash:", {
    publicKeys: newinfo.tx.ch_hash.publicKey,
    hash: newinfo.tx.ch_hash,
    Infodata: newinfo.tx.infodata,
    xp: newinfo.tx.ch_hash.xp
  })
  var chashisvalid = camhash.verifyChameleonHash(
    newinfo.tx.ch_hash.publicKey, 
    newinfo.tx.ch_hash.hash,
    newinfo.tx.infodata,
    newinfo.tx.ch_hash.xp.r, 
    newinfo.tx.ch_hash.xp.s);  
    console.log("Validação do ch_hash do novo bloco:", chashisvalid);

    if (!chashisvalid) {
        console.error("Chameleon hash inválido para os dados fornecidos."); 
        return{  valid : false,sucesso: false, exit: 2,
          error: 'Falha ao verificar ch_hash.',
          message: 'Chameleon hash inválido para os dados fornecidos.',
          detail: "Os dados fornecidos não correspondem ao ch_hash fornecido."}

        }
} catch (error) {
  return{  valid : false,sucesso: false, exit: 3,
    error: 'Erro interno: Falha ao verificar ch_hash.',
    message: 'Ocorreu um erro ao verificar o ch_hash dos dados fornecidos.',
    detail: error.message}

  
}

console.log("Chameleon hash válido para os dados fornecidos. Prosseguindo...", chashisvalid);



  try {

        // checa se usuário já existe
    const sqlCheck = `SELECT userdata_id, userdata_address 
    FROM userdata 
    WHERE userdata_address = ? OR userdata_id = ?;`;
    
    console.log("Checando se usuário existe... ",newinfo.tx.userdata_id);
    const sqlChecked = await pool.query(sqlCheck, [newinfo.tx.ch_hash.hash, newinfo.tx.userdata_id]);            
    console.log("Checando se usuário existe...", sqlChecked[0]);

   

    var userdata_id = sqlChecked[0][0].userdata_id;
    console.log("userdata_id do usuário encontrado:", userdata_id);

    ////await pool.query(sqlCheck, sqlChecked);
    if (!sqlChecked[0].length > 0) {
        console.log("Usuário não existe:", sqlChecked[0][0]);
        return{sucesso: false, exit: 4,
          error: "Usuário não existe",
          exist : true,
          code : "409", 
          message : "Não existe um registro com este endereço ou ID."}
   
    }   
    
  } catch (error) {
    return{sucesso: false, exit: 5,
      error: "Erro interno: Falha ao verificar existência do usuário",
      detail: error.message,
      message: "Ocorreu um erro ao verificar a existência do usuário para atualização."
        }
    
  }

console.log("Usuário" + userdata_id + " existe. Prosseguindo para atualização do bloco..."); 

   

    //verifica se existe o userdata_address
    try {
    console.log("BODY RECEBIDO PARA VERIFICAÇÃO DO BLOCO:", newinfo);
    var sqlCheck = `SELECT userdata_id, userdata_address 
    FROM userdata
    WHERE userdata_address = ?;`;
    console.log("Checando se userdata_address existe para atualização...");
    var sqlChecked = await pool.query(sqlCheck, [newinfo.tx.ch_hash.hash]);            
    console.log("Checando se userdata_address existe para atualização...", sqlChecked[0]);
    userdata_id = sqlChecked[0][0].userdata_id;
    if (sqlChecked[0].length === 0) {
        console.log("userdata_address não existe para atualização:", newinfo.tx.ch_hash.hash);
        return {sucesso: false, exit: 6,
          error: "userdata_address não existe para atualização",
          exist : false,
          code : "404",
          message : "Não existe um registro com o endereço fornecido para atualização."}
          
        }      
    
      
    } catch (error) {
      console.error("Erro ao checar se userdata_address existe para atualização:", error);
      return {sucesso: false, exit: 7, 
        error: "Erro interno: Falha ao checar se userdata_address existe para atualização",
        detail: error.message,
        message: "Ocorreu um erro ao verificar a existência do endereço para atualização."
      };
    }

console.log("userdata_address existe. Prosseguindo para atualização...");



try {
    //verifica se chhash é igual ao do último bloco
    //let lastblock = await selectBlockslast();
    var sqlLastBlock = `SELECT 
B.block_number, B.time_stamp, B.parent_hash,  B.block_hash,
O.node_id AS origin_id, O.node_level AS origin_level, S.node_address AS origin_address, S.node_pb_key AS origin_pb_key,
S.node_id AS sealer_id, S.node_level AS sealer_level, S.node_address AS sealer_address, S.node_pb_key AS sealer_pb_key,
D.userdata_id, D.userdata_address,D.userdata_pb_key, D.infodata, B.ch_hash, B.cuckoofilter_hash, B.userdata_id_hash
FROM blocks as B
INNER JOIN userdata as D ON B.userdata_address=D.userdata_address 
INNER JOIN nodes as S ON B.sealer_node_id=S.node_id
INNER JOIN nodes as O ON B.sealer_node_id=O.node_id
WHERE D.userdata_address = ?
ORDER BY block_number DESC LIMIT 1; `;
    //const lastblockuserdataaddress = newinfo.userdata_address;
    var lastblock = await pool.query(sqlLastBlock,newinfo.tx.ch_hash.hash);
    console.log("ÚLTIMO BLOCO do endereço RECEBIDO PARA VERIFICAÇÃO:", lastblock[0]);
    console.log("CHASH DO ÚLTIMO BLOCO do endereço:", lastblock[0][0].ch_hash);
    console.log("String infodata: ",JSON.stringify(lastblock[0][0].infodata));
    var infodataHex = Buffer.from(JSON.stringify(lastblock[0][0].infodata), 'utf8').toString('hex');
    
    console.log("MSGHEX DO ÚLTIMO BLOCO do endereço:", infodataHex);
    var block_publicKey = lastblock[0][0].ch_hash.publicKey; 
    var p = lastblock[0][0].ch_hash.publicKey.p;
    var q = lastblock[0][0].ch_hash.publicKey.q;
    var g = lastblock[0][0].ch_hash.publicKey.g;
    var y = lastblock[0][0].ch_hash.publicKey.y;
    var r = lastblock[0][0].ch_hash.xp.r;
    var s = lastblock[0][0].ch_hash.xp.s;

    var lastblockbcuckoofilter_hash = lastblock[0][0].cuckoofilter_hash;
  

    //const valid = verifyChameleon(lastblock.ch_hash.params, msgHex, r, s, h);
    var validchash = camhash.verifyChameleonHash(
      block_publicKey, 
      newinfo.tx.ch_hash.hash,
      newinfo.tx.infodata, 
      newinfo.tx.ch_hash.xp.r, 
      newinfo.tx.ch_hash.xp.s);
    console.log("VALIDAÇÃO DO CHASH DO ÚLTIMO BLOCO do endereço:", validchash);
    if (!validchash) {
        console.log("Chameleon hash inválido. Atualização não permitida.");
        return {sucesso: false, exit: 8}; // Sai da função sem atualizar
    }   
    console.log("Chameleon hash válido para atualização de infodata do endereço.");  

    
  
} catch (error) {
    console.error("Erro ao verificar ch_hash do último bloco do endereço:", error);
    return {sucesso: false, exit: 9,
      error: "Erro interno: Falha ao verificar ch_hash do último bloco do endereço",
      detail: error.message,
      message: "Ocorreu um erro ao verificar o ch_hash do último bloco."
    };
  
}
 console.log("ch_hash igual ao do último bloco. Prosseguindo para atualização...");  

 // Verifica validade do cuckoo filter hash com o último bloco inserido
 var CuckooFilterHashisvalid = await isvalideCuckooFilterHash();

   console.log("Cuckoofilter Válido:", CuckooFilterHashisvalid);

   if (!CuckooFilterHashisvalid) {
    console.error("O hash do Cuckoo filter e do último bloco inserido não correspondem. Blockchain violada.");
    return {error: "O hash do Cuckoo filter e do último bloco inserido não correspondem. Blockchain violada."};
   }


    // Retorna HASH do Cuckoo filter antes de inserir novo usuário
  console.log("Tentando recuperar o HASH do Cuckoo filter original...");
  var HashCuckooFilter_original = await getCuckooFilterHash(); 
  if (!HashCuckooFilter_original.Sucess) {
    console.log("Sucess:", HashCuckooFilter_original.Suscess);
    console.log("Erro interno 3: Erro ao adicionar novo usuário ao filtro:")
    return {error: "Erro interno 3: Falha ao recuperar o HASH do Cuckoo filter"};
  }

  console.log("HASH do Cuckoo filter original:", HashCuckooFilter_original.hash);

try {
      // Atualiza userdata
        console.log("BODY RECEBIDO PARA ATUALIZAÇÃO DO BLOCO:", newinfo);


    // mode 1 para atualização simples, mode 0 para exercício do direito ao esquecimento (infodata vazio)
    if (newinfo.mode===1) {
      const sql = `UPDATE userdata
      SET infodata = ?
      WHERE userdata_address = ?;`;    
      var values = [JSON.stringify(newinfo.tx.infodata), newinfo.tx.ch_hash.hash];
      console.log("VALUES PARA ATUALIZAÇÃO DO BLOCO:", values);
      await pool.query(sql, values);
      console.log("USERDATA ATUALIZADO COM SUCESSO.");
    }
      

    if (newinfo.mode===0) {
        const sql = `UPDATE userdata
        SET infodata = ?, userdata_id = NULL
        WHERE userdata_address = ?;`; 
        console.log("Exercício do direito ao esquecimento - Atualizando userdata para vazio e removendo ID:" + userdata_id);
        // var values = [JSON.stringify({user_Id: String(crypto.createHash('SHA3-256').update(userdata_id).digest('hex')), deleted: true, motivo: "Exercício do direito ao esquecimento"}),
        //   String(crypto.createHash('SHA3-256').update(userdata_id).digest('hex')), 
        //   newinfo.tx.ch_hash.hash];
        var values = [JSON.stringify(newinfo.tx.infodata),
          newinfo.tx.ch_hash.hash];        
        console.log("VALUES PARA ATUALIZAÇÃO DO BLOCO:", values);
      await pool.query(sql, values);
      console.log("USERDATA ATUALIZADO COM SUCESSO.");
      }


    

  
} catch (error) {
    console.error("Erro ao atualizar userdata:", error);
    return {sucesso: false, exit: 10,
      error: "Erro interno: Falha ao atualizar userdata",
      detail: error.message,
      message: "Ocorreu um erro ao atualizar os dados do usuário."
    };
}
console.log("userdata atualizado. Prosseguindo para criação do bloco de atualização...");

// Atualiza no filtro cuckoo filter dependendo do modo de atualização (1 para atualização simples, 0 para exercício do direito ao esquecimento)
if (newinfo.mode===1) {
  console.log("mode: ", newinfo.mode, " Modo de atualização simples selecionado. Prosseguindo para adicionar usuário ao filtro...");
try {
  
    console.log("Adicionando novo usuário ao filtro: ", userdata_id);
    
    var CuckoofilterInserted = await cfInsert(String(userdata_id));
  
    var ResultCuckoofilterInsert = ""

    if (CuckoofilterInserted.failed) {
      console.error("Falha ao adicionar novo usuário ao filtro.");
      return {exit: 12, sucesso: false,error: "Erro interno: Falha ao adicionar novo usuário ao filtro"};
    }

      if (CuckoofilterInserted.alreadyPresent) {
       console.log("Usuário já existe no filtro:", CuckoofilterInserted);
      ResultCuckoofilterInsert = "Dados de usuário atualizado, bloco criado com sucesso e confirmado que usuário já existe no filtro.";
       // return {
      //   sucesso: true, exit: 13,
      //   message: "Dados de usuário atualizado, bloco criado com sucesso e confirmado que usuário já existe no filtro."
      //   }
      }
    
          if (CuckoofilterInserted.inserted) {
       console.log("Usuário que não estava agora já existe no filtro.:", CuckoofilterInserted);
      ResultCuckoofilterInsert = "Dados de usuário atualizado, bloco criado com sucesso e usuário que não estava agora já existe no filtro.";
      // return {
      //   sucesso: true, exit: 14,
      //   message: "Dados de usuário atualizado, bloco criado com sucesso e usuário que não estava agora já existe no filtro."
      //   }
      }
 

  } catch (error) {
    console.error("Erro ao adicionar novo usuário ao filtro:", error);
    return {sucesso: false, exit: 15,error: "Erro interno: Falha ao adicionar novo usuário ao filtro",
    detail: error.message
    };    
  }
}

if (newinfo.mode===0) {
  console.log("mode: ", newinfo.mode, " Modo de remoção selecionado. Prosseguindo para remover usuário ao filtro...");

try {
  
    console.log("Exercício do direito ao esquecimento - Apagando usuário do filtro: ", userdata_id);
    
    var CuckoofilterDeleted = await cfDelete(String(userdata_id));
  

    if (!CuckoofilterDeleted.deleted) {
      console.error("Falha ao remover usuário do filtro.");
      return {sucesso: false, exit: 16, error: "Erro interno: Falha ao remover usuário do filtro"};
    }

      if (CuckoofilterDeleted.deleted) {
       console.log("Confirmado que usuário existia e foi apagado do filtro:", CuckoofilterDeleted);
      ResultCuckoofilterInsert = "Dados de usuário deletado por exercício do direito ao esquecimento, bloco criado com sucesso e confirmado que usuário já existia e foi apagado do filtro.";
      //  return {
      //   sucesso: true, exit: 17,
      //   message: "Dados de usuário deletado por exercício do direito ao esquecimento, bloco criado com sucesso e confirmado que usuário já existia e foi apagado do filtro."
      //   }
      }
    
    

  } catch (error) {
    console.error("Erro ao remover usuário do filtro:", error);
    return {sucesso: false, exit: 18, error: "Erro interno: Falha ao remover usuário do usuário ao filtro",
    detail: error.message
    };    
  }
} 
// else {
//   console.log("Modo de operação não reconhecido parâmetro MODE precisa ser 0 ou 1. Nenhuma ação adicional será tomada no filtro.");
//    return {sucesso: false, exit: 19, error: "Erro interno: MODE precisa ser 0 ou 1",
//     detail: error.message
// }
// }

  // Retorna HASH do Cuckoo filter do usuário novo inserido ou deletado
  console.log("Tentando recuperar o HASH do Cuckoo filter da nova atualização do usuário...");
  var HashCuckooFilter_new = await getCuckooFilterHash(); 
  if (!HashCuckooFilter_new.Sucess) {
    console.log("Sucess:", HashCuckooFilter_new.Suscess);
    console.log("Erro interno 3: Erro ao atualizar usuário ao filtro:")
    return {error: "Erro interno 3: Falha ao recuperar o HASH do Cuckoo filter"};
  }

  console.log("HASH do Cuckoo filter do usuário após atualização:", HashCuckooFilter_new.hash);



try {
  //Criando bloco de atualização
    ////let last_block = await selectFullBlockslast();
    //console.log("BODY RECEBIDO:",last_block_hash[0].block_hash); //OK
    ////const block_hash =sha3_256_FromJson(block)
    console.log("block_hash do bloco anterior:", lastblock[0][0].block_hash);
    console.log("ch_hash do newinfo:", newinfo.tx.ch_hash);
    const sqlinsertblock = `INSERT INTO blocks
    (block_number,parent_hash,origin_node_id,sealer_node_id,userdata_address,ch_hash,cuckoofilter_hash,userdata_id_hash,time_stamp) 
    VALUES (?,?,?,?,?,?,?,?,strftime('%Y-%m-%d %H:%M:%f', 'now'));`;
    console.log("Definindo valores para inserção do bloco: " + userdata_id);
    const valuesinsertblock = [parseInt(lastblock[0][0].block_number) + 1, 
    lastblock[0][0].block_hash, 
    global.origin_node.origin_node_id, 
    global.sealer_node.sealer_node_id,
    newinfo.tx.ch_hash.hash,
    JSON.stringify(newinfo.tx.ch_hash),
    HashCuckooFilter_new.hash,
    crypto.createHash('SHA3-256').update(userdata_id).digest('hex')];   
    //JSON.stringify(lastblock[0][0].ch_hash)];
    console.log("INSERINDO BLOCO...");
    console.log("Valores:", JSON.stringify(valuesinsertblock));
    //console.log("VALUES:", values);
    //insere tudo menos o block_hash
    await pool.query(sqlinsertblock, valuesinsertblock);
    console.log("BLOCO INSERIDO...");

  
} catch (error) {
    console.error("Erro ao inserir novo bloco de atualização:", error);
    return {sucesso: false, exit: 11,
      error: "Erro interno: Falha ao inserir novo bloco de atualização",
      detail: error.message,
      message: "Ocorreu um erro ao criar o bloco de atualização."
    };  
  
}

    
try {
      //retorna o bloco inserido sem o block_hash

    //var [result] = await pool.query(sql2, values);
    //var insertId = sql2.datanumber;
    //console.log("INSERT ID:", insertId);
    //console.log("result:", result);

    console.log("BLOCO PARA CALCULAR block HASH:", parseInt(lastblock[0][0].block_number) + 1);
// PÇP
    var blocosemhash = await selectBlockbyNumber_NoblockHash(parseInt(lastblock[0][0].block_number) + 1);
console.log("BLOCO SEM block HASH RECUPERADO:", blocosemhash);

  var block_hash = await calcblockhash(parseInt(lastblock[0][0].block_number) + 1);
console.log("block HASH CALCULADO:", block_hash);


    //atualiza o block_hash do bloco inserido
    const updateSql = 'UPDATE blocks SET block_hash = ? WHERE block_number = ?;';
    const updateValues = [block_hash, parseInt(lastblock[0][0].block_number) + 1];
    console.log("UPDATE VALUES:", updateValues);
    console.log("ATUALIZANDO block HASH DO BLOCO...");
    await pool.query(updateSql, updateValues);
    console.log("block HASH ATUALIZADO COM SUCESSO.");
  
} catch (error) {
    console.error("Erro ao recuperar o bloco inserido para atualização do block_hash:", error);
    return {sucesso: false, exit: 11,
      error: "Erro interno: Falha ao recuperar o bloco inserido para atualização do block_hash",
      detail: error.message,
      message: "Ocorreu um erro ao recuperar o bloco inserido para calcular o block_hash."
    };

  
}

console.log("BLOCO INSERIDO COM block_HASH ATUALIZADO:", parseInt(lastblock[0][0].block_number) + 1);
return { sucesso: true, exit: 20,  message: ResultCuckoofilterInsert,
  //blockNumber: parseInt(lastblock[0][0].block_number) + 1,
  //blockData: lastblock[0]
  //block_hash: blocknoblockhash,
  //chHash: newinfo.tx.ch_hash

};


}

// cuckoo filter

/**
 * ---------- Helpers: canonical JSON ----------
 */

//const stableStringify = require('fast-json-stable-stringify');

function canonicalStringify(obj) {
  // Se vier algo não-JSON (com BigInt, etc.) ele pode falhar.
    return stableStringify(obj);
}


/**
 * ---------- DB: active filter meta (cacheado) ----------
 */
async function getActiveFilterMeta(conn) {
  const now = Date.now();
  if (cachedFilter && (now - cachedFilter.cachedAt) < FILTER_CACHE_TTL_MS) return cachedFilter;

  const [rows] = await conn.query(
    `SELECT id, num_buckets AS numBuckets, max_kicks AS maxKicks, bucket_size AS bucketSize, fp_bits AS fpBits
     FROM cf_filters
     WHERE is_active = 1
     LIMIT 1`
  );

  if (!rows || rows.length === 0) {
    throw new Error('Nenhum cf_filters ativo (is_active=1) encontrado.');
  }

  const f = rows[0];
  const numBuckets = Number(f.numBuckets);
  const mask = (numBuckets - 1) >>> 0;

  cachedFilter = {
    id: Number(f.id),
    numBuckets,
    mask,
    maxKicks: Number(f.maxKicks),
    bucketSize: Number(f.bucketSize),
    fpBits: Number(f.fpBits),
    cachedAt: now,
  };

  return cachedFilter;
}
/**
 * ---------- DB: bucket read/update ----------
 */
function bucketHas(bucketRow, fp) {
  return bucketRow.s0 === fp || bucketRow.s1 === fp || bucketRow.s2 === fp || bucketRow.s3 === fp;
}
function findEmptySlot(bucketRow) {
  if (bucketRow.s0 === 0) return 0;
  if (bucketRow.s1 === 0) return 1;
  if (bucketRow.s2 === 0) return 2;
  if (bucketRow.s3 === 0) return 3;
  return -1;
}
function setSlot(bucketRow, slot, value) {
  if (slot === 0) bucketRow.s0 = value;
  else if (slot === 1) bucketRow.s1 = value;
  else if (slot === 2) bucketRow.s2 = value;
  else bucketRow.s3 = value;
}
function getSlot(bucketRow, slot) {
  if (slot === 0) return bucketRow.s0;
  if (slot === 1) return bucketRow.s1;
  if (slot === 2) return bucketRow.s2;
  return bucketRow.s3;
}
async function selectBucketForUpdate(conn, filterId, bucketId) {
  // garante existência
  await conn.query(
    `INSERT INTO cf_buckets (filter_id, bucket_id, s0, s1, s2, s3)
     VALUES (?, ?, 0, 0, 0, 0)
     ON CONFLICT(filter_id, bucket_id) DO NOTHING`,
    [filterId, bucketId]
  );

  const [rows] = await conn.query(
    `SELECT bucket_id AS bucketId, s0, s1, s2, s3
     FROM cf_buckets
     WHERE filter_id = ? AND bucket_id = ?`,
    [filterId, bucketId]
  );

  return rows[0];
}
async function selectBucket(conn, filterId, bucketId) {
  const [rows] = await conn.query(
    `SELECT bucket_id AS bucketId, s0, s1, s2, s3
     FROM cf_buckets
     WHERE filter_id = ? AND bucket_id = ?`,
    [filterId, bucketId]
  );
  if (!rows || rows.length === 0) return null;
  return rows[0];
}
async function updateBucket(conn, filterId, bucketId, b) {
  await conn.query(
    `UPDATE cf_buckets
     SET s0 = ?, s1 = ?, s2 = ?, s3 = ?
     WHERE filter_id = ? AND bucket_id = ?`,
    [b.s0, b.s1, b.s2, b.s3, filterId, bucketId]
  );
}
/**
 * ---------- Core ops ----------
 */

const stableStringify = require('fast-json-stable-stringify');

async function cfContains(conn, userData) {
  const meta = await getActiveFilterMeta(conn);

  // normaliza primeiro (garante JSON puro e remove qualquer coisa estranha)
  const normalized = JSON.parse(JSON.stringify(userData));
  const canon = stableStringify(normalized);

  const h64 = hash64FromString(canon);
  const fp = fingerprint32FromString(canon);

  const i1 = idx1(h64, meta.mask);
  const i2 = idx2(i1, fp, meta.mask);

  const [b1, b2] = await Promise.all([
    selectBucket(conn, meta.id, i1),
    i2 === i1 ? Promise.resolve(null) : selectBucket(conn, meta.id, i2),
  ]);

  const hit1 = b1 ? bucketHas(b1, fp) : false;
  const hit2 = b2 ? bucketHas(b2, fp) : false;

  return { exists: hit1 || hit2, fp, i1, i2, filterId: meta.id };
}


function stableStringifyJson(value) {
  const seen = new WeakSet();

  function normalize(v, path = '$') {
    if (v === null) return null;

    const type = typeof v;

    if (type === 'string' || type === 'boolean') {
      return v;
    }

    if (type === 'number') {
      if (!Number.isFinite(v)) {
        throw new TypeError(`Número inválido em ${path}`);
      }

      return v;
    }

    if (
      type === 'undefined' ||
      type === 'function' ||
      type === 'symbol' ||
      type === 'bigint'
    ) {
      throw new TypeError(`Tipo não serializável em ${path}: ${type}`);
    }

    if (Array.isArray(v)) {
      if (seen.has(v)) {
        throw new TypeError(`Referência circular detectada em ${path}`);
      }

      seen.add(v);

      const result = v.map((item, index) => {
        return normalize(item, `${path}[${index}]`);
      });

      seen.delete(v);

      return result;
    }

    if (type === 'object') {
      if (seen.has(v)) {
        throw new TypeError(`Referência circular detectada em ${path}`);
      }

      seen.add(v);

      const result = {};

      for (const key of Object.keys(v).sort()) {
        result[key] = normalize(v[key], `${path}.${key}`);
      }

      seen.delete(v);

      return result;
    }

    throw new TypeError(`Valor inválido em ${path}`);
  }

  return JSON.stringify(normalize(value));
}

async function cfDelete(userData) {
  const conn = await pool.getConnection();
  try {
  const meta = await getActiveFilterMeta(conn);
  //const canon = canonicalStringify(userData);
  const canon = stableStringify(userData);

  const h64 = hash64FromString(canon);
  const fp = fingerprint32FromString(canon);

  const i1 = idx1(h64, meta.mask);
  const i2 = idx2(i1, fp, meta.mask);

  // Lock ordering para evitar deadlock
  const a = Math.min(i1, i2);
  const b = Math.max(i1, i2);

  await conn.beginTransaction();
  try {
    const ba = await selectBucketForUpdate(conn, meta.id, a);
    const bb = (b === a) ? null : await selectBucketForUpdate(conn, meta.id, b);

    let deleted = false;

    // tenta remover em ba
    for (let s = 0; s < 4; s++) {
      if (getSlot(ba, s) === fp) {
        setSlot(ba, s, 0);
        await updateBucket(conn, meta.id, a, ba);
        deleted = true;
        break;
      }
    }

    // se não achou, tenta em bb
    if (!deleted && bb) {
      for (let s = 0; s < 4; s++) {
        if (getSlot(bb, s) === fp) {
          setSlot(bb, s, 0);
          await updateBucket(conn, meta.id, b, bb);
          deleted = true;
          break;
        }
      }
    }

    if (deleted) {
      await conn.query(
        `UPDATE cf_filters SET item_count = CASE WHEN item_count > 0 THEN item_count - 1 ELSE 0 END WHERE id = ?`,
        [meta.id]
      );
    }

    await conn.commit();
    return { deleted, fp, i1, i2, filterId: meta.id };
  } catch (e) {
    await conn.rollback();
    throw e;
  }
  } finally {
    conn.release();
  }
}
async function cfInsert(userData) {
    const conn = await pool.getConnection();
  try {
  const meta = await getActiveFilterMeta(conn);
  //const canon = canonicalStringify(userData);
  const canon = stableStringify(userData);

  const h64 = hash64FromString(canon);
  let fp = fingerprint32FromString(canon);

  const i1 = idx1(h64, meta.mask);
  const i2 = idx2(i1, fp, meta.mask);

  await conn.beginTransaction();
  try {
    // Lock ordering para i1/i2 no “fast path”
    const a = Math.min(i1, i2);
    const b = Math.max(i1, i2);

    const ba = await selectBucketForUpdate(conn, meta.id, a);
    const bb = (b === a) ? null : await selectBucketForUpdate(conn, meta.id, b);

    // Já existe?
    if (bucketHas(ba, fp) || (bb && bucketHas(bb, fp))) {
      await conn.commit();
      return { inserted: false, alreadyPresent: true, fp, i1, i2, filterId: meta.id };
    }

    // Tenta inserir em ba
    let empty = findEmptySlot(ba);
    if (empty !== -1) {
      setSlot(ba, empty, fp);
      await updateBucket(conn, meta.id, a, ba);
      await conn.query(`UPDATE cf_filters SET item_count = item_count + 1 WHERE id = ?`, [meta.id]);
      await conn.commit();
      return { inserted: true, alreadyPresent: false, fp, i1, i2, filterId: meta.id };
    }

    // Tenta inserir em bb
    if (bb) {
      empty = findEmptySlot(bb);
      if (empty !== -1) {
        setSlot(bb, empty, fp);
        await updateBucket(conn, meta.id, b, bb);
        await conn.query(`UPDATE cf_filters SET item_count = item_count + 1 WHERE id = ?`, [meta.id]);
        await conn.commit();
        return { inserted: true, alreadyPresent: false, fp, i1, i2, filterId: meta.id };
      }
    }

    // Se chegou aqui: i1 e i2 cheios -> cuckoo kicks
    // Nota: esta implementação mantém a transação aberta durante os kicks.
    // Para 100 ops/s single instance costuma ser OK; se quiser, dá pra refatorar para "commit por passo".
    let curIndex = (randomInt(2) === 0 ? i1 : i2) >>> 0;

    for (let kick = 0; kick < meta.maxKicks; kick++) {
      const bcur = await selectBucketForUpdate(conn, meta.id, curIndex);

      // Evict random slot
      const slot = randomInt(4);
      const evicted = getSlot(bcur, slot);
      setSlot(bcur, slot, fp);
      await updateBucket(conn, meta.id, curIndex, bcur);

      fp = evicted >>> 0;
      if (fp === 0) {
        // Evict de um slot vazio (raro, mas pode acontecer se concorrência/padrões)
        await conn.query(`UPDATE cf_filters SET item_count = item_count + 1 WHERE id = ?`, [meta.id]);
        await conn.commit();
        return { inserted: true, alreadyPresent: false, kicked: kick + 1, fp, i1, i2, filterId: meta.id };
      }

      // próximo bucket do fp evictado
      curIndex = idx2(curIndex, fp, meta.mask);

      // tenta inserir no próximo bucket se tiver espaço
      const bnext = await selectBucketForUpdate(conn, meta.id, curIndex);
      const e2 = findEmptySlot(bnext);
      if (e2 !== -1) {
        setSlot(bnext, e2, fp);
        await updateBucket(conn, meta.id, curIndex, bnext);
        await conn.query(`UPDATE cf_filters SET item_count = item_count + 1 WHERE id = ?`, [meta.id]);
        await conn.commit();
        return { inserted: true, alreadyPresent: false, kicked: kick + 1, fp, i1, i2, filterId: meta.id };
      }
    }

    // Falhou após maxKicks: sinalize para o caller iniciar doubling/migração
    await conn.rollback();
    return { failed: true, inserted: false, alreadyPresent: false, needsResize: true, fp, i1, i2, filterId: meta.id };
  } catch (e) {
    await conn.rollback();
    throw e;
  }
  } finally {
    conn.release();
  }
}


// cuckoo filter
function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}
function hash64FromString(str) {
  const d = sha256(Buffer.from(str, 'utf8'));
  // 8 bytes big-endian
  let x = 0n;
  for (let i = 0; i < 8; i++) x = (x << 8n) | BigInt(d[i]);
  return x;
}
function uint32FromDigest(d, offset) {
  return (
    ((d[offset] << 24) >>> 0) |
    (d[offset + 1] << 16) |
    (d[offset + 2] << 8) |
    d[offset + 3]
  ) >>> 0;
}
function fingerprint32FromString(str) {
  const d = sha256(Buffer.from(str, 'utf8'));
  let fp = uint32FromDigest(d, 8); // pega bytes 8..11
  if (fp === 0) fp = 1; // 0 é "vazio"
  return fp >>> 0;
}
function hash32FromUint32(u) {
  // Mistura simples (xorshift-ish) para espalhar o fp nos buckets
  let x = u >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}
function idx1(hash64, mask) {
  // mask é numBuckets-1 (potência de 2)
  return Number(hash64 & BigInt(mask)) >>> 0;
}
function idx2(i1, fp, mask) {
  const h = hash32FromUint32(fp) & mask;
  return (i1 ^ h) >>> 0;
}

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

async function getCuckooFilterHash() {

  // var selecthashcuckofilter = `SELECT 
  // SHA2(GROUP_CONCAT(CONCAT_WS(',', filter_id, bucket_id, s0, s1, s2, s3) 
  // ORDER BY bucket_id ASC),256) AS hash_cuckoofilter
  // FROM cf_buckets;`;
    var selecthashcuckofilter = `SELECT GROUP_CONCAT(bucket, ',') AS hash_cuckoofilter FROM (SELECT filter_id || ',' || bucket_id || ',' || s0 || ',' || s1 || ',' || s2 || ',' || s3 AS bucket FROM cf_buckets ORDER BY bucket_id ASC)`;
    const res = await pool.query(selecthashcuckofilter);  

    //console.log("HASH DO CUCKOO FILTER:", res[0][0].hash_cuckoofilter);


    // Compatibilidade com os hashes migrados: GROUP_CONCAT anterior limitava a 1024 caracteres.
    return { Sucess: true, hash: crypto.createHash('SHA3-256').update((res[0][0].hash_cuckoofilter || '').slice(0, 1024)).digest('hex') };

}

async function CheckCuckooFilterHash() {
   console.log("Tentando recuperar o HASH do Cuckoo filter...");
  var HashCuckooFilter_original = await getCuckooFilterHash(); 
  if (!HashCuckooFilter_original.Sucess) {
    console.log("Sucess:", HashCuckooFilter_original.Suscess);
    console.log("Erro interno 3: Erro ao adicionar novo usuário ao filtro:")
    return {Sucess: false, error: "Erro interno 3: Falha ao recuperar o HASH do Cuckoo filter"};
  }

  console.log("HASH do Cuckoo filter:", HashCuckooFilter_original.hash);

    // Checa se o hash do Cuckoo filter é válido com o último bloco inserido
    var CuckooFilterHashisvalid = await isvalideCuckooFilterHash();

   console.log("Cuckoofilter Válido:", CuckooFilterHashisvalid);

   if (!CuckooFilterHashisvalid) {
    console.error("O hash do Cuckoo filter e do último bloco inserido não correspondem. Blockchain violada.");
    return {Sucess: false, error: "O hash do Cuckoo filter e do último bloco inserido não correspondem. Blockchain violada."};
   }

   return { Sucess: true, hash: HashCuckooFilter_original.hash, valid: CuckooFilterHashisvalid,
    message: "Cuckoo filter hash successfully retrieved and validated against the last inserted block. - HASH do Cuckoo filter recuperado com sucesso e validado com o último bloco inserido."

   }
}
//POIO
async function cfcheckrighttobeforgoten(conn, userdata) {
   console.log("Procurando por cuckoofilter_hash correspondente...");

   var userdata_id_hash = crypto.createHash('SHA3-256').update(userdata.user_data_id).digest('hex');
   //console.log("infodata:", userdata);
   console.log("cuckoofilter_hash:", userdata.cuckoofilter_hash);
   console.log("userdata_id_hash:", userdata_id_hash);

   var cfcheckstring = `SELECT block_number, time_stamp, cuckoofilter_hash, userdata_id_hash FROM blocks WHERE cuckoofilter_hash = ? AND userdata_id_hash = ? ORDER BY block_number DESC LIMIT 1;`;
  //console.log("cfcheckstring:", cfcheckstring);
  console.log("Tentando executar a consulta para verificar cuckoofilter_hash correspondente...");                
const block = await conn.query(cfcheckstring, [userdata.cuckoofilter_hash, userdata_id_hash])
  // try {
  //         const block = await pool.query(cfcheckstring)
  //         } catch (error) {return {error: "Erro interno: Falha ao verificar cuckoofilter_hash correspondente",
  //         detail: error.message,
  //         message: "Ocorreu um erro ao verificar cuckoofilter_hash correspondente."}
  //       }
console.log("Tamanho do bloco:", block[0].length);
if (block[0].length === 0) {
  console.error("Nenhum bloco encontrado com cuckoofilter_hash correspondente.");
  return {sucess:false, message_pt: "Nenhum bloco encontrado com cuckoofilter_hash correspondente.",
  message_en: "No block found with corresponding cuckoofilter_hash."
  };
}

console.log("Bloco encontrado com cuckoofilter_hash correspondente:", block[0]);
  var HashCuckooFilter_original = await getCuckooFilterHash(); 
  if (!HashCuckooFilter_original.Sucess) {
    console.log("Sucess:", HashCuckooFilter_original.Suscess);
    console.log("Erro interno 3: Erro ao adicionar novo usuário ao filtro:")
    return { sucess: false,
      message_pt: "Erro interno 3: Falha ao recuperar o HASH do Cuckoo filter",
    message_en: "Internal error 3: Failed to retrieve the Cuckoo filter HASH"
    };
  }
//PÇLO
  console.log("Checando se o hash do Cuckoo filter é válido com o último bloco inserido...");
  console.log("HASH do Cuckoo filter:", HashCuckooFilter_original.hash);

    // Checa se o hash do Cuckoo filter é válido com o último bloco inserido
    var CuckooFilterHashisvalid = await isvalideCuckooFilterHash();

   console.log("Cuckoofilter Válido:", CuckooFilterHashisvalid);

   if (!CuckooFilterHashisvalid) {
    console.error("O hash do Cuckoo filter e do último bloco inserido não correspondem. Blockchain violada.");
    return {
      sucess: false,
      message_pt: "O hash do Cuckoo filter e do último bloco inserido não correspondem. Blockchain violada.",
      message_en: "The hash of the Cuckoo filter and the last inserted block do not match. Blockchain violated."
    };
   }

   console.log("Checando se user_id está nocklist do cuckoo filter...");
   var cfcheckuser = await cfContains(conn, userdata.user_data_id);
   console.log("Resultado da verificação do user_id no cuckoo filter:", cfcheckuser);

   if (cfcheckuser.exists) {
    console.log("Usuário encontrado no cuckoo filter, certificado válido mas expirado.");
    return {sucess:false, 
      message_pt: "Usuário encontrado no cuckoo filter, certificado válido mas expirado.",
      message_en: "User found in cuckoo filter, valid but expired certificate."
    };
   }

   return { sucess: true, 
    block_number: block[0][0].block_number,
    time_stamp: block[0][0].time_stamp,
    userdata_id_hash: userdata_id_hash,
    cuckoofilter_hash: userdata.cuckoofilter_hash, 
    valid: CuckooFilterHashisvalid,
    User_exists_on_cuckoofilter: cfcheckuser.exists,
    message_pt: "Certificado de direito ao esquecimento válido. Usuário não encontrado no cuckoo filter. HASH do Cuckoo filter recuperado com sucesso e validado com o último bloco inserido.",
    message_en: "Valid right to be forgotten certificate. User not found in cuckoo filter. Cuckoo filter HASH successfully retrieved and validated with the last inserted block."

   }
}

module.exports = {selectBlocks, selectFullBlockslast, selectBlockslast, selectNodes, selectNodebynode, selectNodebyid, selectNodebypb_key, insertNode,
addNewDataUser, updateuserdata,  selectBlockslastblock_hash, getActiveFilterMeta, bucketHas, findEmptySlot, sha3_256_FromJson, setSlot,
getSlot, selectBucketForUpdate, selectBucket, updateBucket, cfContains, selectblockslimit,lastblocksID,BlockbyID,
cfDelete, cfInsert, sha256, hash64FromString, uint32FromDigest, fingerprint32FromString, selectFullBlockbyID, verifyBlockbyID,
    hash32FromUint32, idx1,idx2, randomInt, selectBlockbyNumber_NoblockHash, calcblockhash,selectBlockbyNumber,
  selectBlocksPage, blockscount, CheckCuckooFilterHash, cfcheckrighttobeforgoten, getCuckooFilterHash, isvalideCuckooFilterHash, cfInsert, cfDelete, updateuserdata};

    