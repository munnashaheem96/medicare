import crypto from 'crypto';
import fs from 'fs';

const password = 'abc123456';
const hash = crypto.createHash('sha256').update(password).digest('base64');

const data = {
  users: [
    {
      localId: "m8QLty2h0LNUBHOGp2IdnpcCNcc2",
      email: "admin@meditrack.com",
      passwordHash: hash
    }
  ]
};

fs.writeFileSync('import_admin.json', JSON.stringify(data, null, 2));
console.log('SHA256 Hash of abc123456:', hash);
console.log('import_admin.json generated.');
