const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'db#ilnnlmwleo1428071020072006';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hash);
}

generateHash();