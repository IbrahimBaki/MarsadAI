#!/usr/bin/env node
// Prints a hashed password line for the AUTH_USERS env var.
// Usage: npm run hash-password -- <username> <password>
import { randomBytes, scryptSync } from "node:crypto";

const [user, password] = process.argv.slice(2);
if (!user || !password) {
  console.error("Usage: npm run hash-password -- <username> <password>");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
console.log(`${user.toLowerCase()}:scrypt.${salt.toString("hex")}.${hash.toString("hex")}`);
