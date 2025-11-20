import { hashPassword } from './server/auth.ts';

async function main() {
  const newPassword = 'TempPassword123!';
  const hash = await hashPassword(newPassword);
  console.log('HASH:', hash);
  console.log('PASSWORD:', newPassword);
}

main().catch(console.error);
