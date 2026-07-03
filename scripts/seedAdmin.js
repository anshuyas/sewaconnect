
require('dotenv').config();
const mongoose = require('mongoose');
const argon2 = require('argon2');
const readline = require('readline');

const UserSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  role: String,
  name: String,
  isVerified: Boolean,
  mfaEnabled: Boolean,
  failedLoginAttempts: Number,
}, { timestamps: true, strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = await ask('Admin email: ');
  const password = await ask('Admin password (min 12 chars): ');
  const name = await ask('Admin name: ');

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('A user with that email already exists. Aborting.');
    await mongoose.disconnect();
    rl.close();
    return;
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await User.create({
    email,
    passwordHash,
    name,
    role: 'admin',
    isVerified: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
  });

  console.log(`Admin account created: ${email}`);
  await mongoose.disconnect();
  rl.close();
}

main().catch(console.error);