import crypto from 'crypto';
import scryptjs from 'scrypt-js';

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptjs.scrypt(Buffer.from(password), Buffer.from(salt, 'hex'), 32768, 8, 1, 64);
  return `${Buffer.from(buf).toString("hex")}.${salt}`;
}

const hash = await hashPassword('TempPassword123!');
console.log(hash);
