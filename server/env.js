const base = __dirname;

const env = {
   base: base,
   debug: !!process.env.CODON_DEBUG,
   auth_internal: false,
   search_path: process.env.CODON_SEARCH_PATH,
   ldap_server: process.env.CODON_LDAP_SERVER,
   keyval: {
      // store key value into file;
      // if null, only in memory
      filename: process.env.CODON_KEYVAL_FILENAME || null
   },
   admins: process.env.CODON_ADMINS?process.env.CODON_ADMINS.split(','):[],
};

module.exports = env;
