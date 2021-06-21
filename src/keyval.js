const i_crypto = require('crypto');
const i_path = require('path');

const i_ut = require('./util');

const keyvalDir = process.env.CODON_KEYVAL_DIR;

function hashKey(key) {
   const h = i_crypto.createHash('md5');
   h.update(key);
   return h.digest('hex');
}

function splitHash(hash) {
   const n = hash.length;
   const r = [];
   for (let i = 0; i < n; i += 4) {
      r.push(hash.substring(i, i+4));
   }
   return r;
}

const api = {
   put: async (key, val) => {
      const targetDir = i_path.join(keyvalDir, ...splitHash(hashKey(key)), escape(key));
      await i_ut.fileOp.mkdir(targetDir);
      await i_ut.fileOp.write(i_path.join(targetDir, '_'), val);
   },
   del: async (key) => {
      const targetDir = i_path.join(keyvalDir, ...splitHash(hashKey(key)), escape(key));
      await i_ut.fileOp.unlink(targetDir);
   },
   get: async (key) => {
      const targetDir = i_path.join(keyvalDir, ...splitHash(hashKey(key)), escape(key));
      return await i_ut.fileOp.read(i_path.join(targetDir, '_'));
   },
   exist: async (key) => {
      const targetDir = i_path.join(keyvalDir, ...splitHash(hashKey(key)), escape(key));
      return await i_ut.fileOp.exist(i_path.join(targetDir, '_'));
   },
};

if (!keyvalDir) {
   throw new Exception('[!] CODON_KEYVAL_DIR is not set.');
}
module.exports = api;
