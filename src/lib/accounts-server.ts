import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ObjectId, type Db } from "mongodb";
import type { SignupInput } from "@/lib/account";
import { getDb } from "@/lib/mongodb";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export interface AccountDoc {
  _id: ObjectId;
  email: string;
  fullName: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Password hashing with Node's built-in `scrypt` — no bcrypt/argon2 dependency needed, and
 * this codebase already hashes/signs with `node:crypto` elsewhere (`admin-auth.ts`). Each
 * account gets its own random salt; the derived key and salt are both stored as hex.
 */
async function hashPassword(plain: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(plain, salt, KEY_LENGTH)) as Buffer;
  return { hash: derived.toString("hex"), salt };
}

async function verifyPassword(plain: string, hash: string, salt: string): Promise<boolean> {
  const derived = (await scryptAsync(plain, salt, KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

let indexesEnsured = false;

export async function ensureAccountIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  await db.collection("accounts").createIndex({ email: 1 }, { unique: true });
  indexesEnsured = true;
}

export async function getAccountByEmail(email: string): Promise<AccountDoc | null> {
  const db = await getDb();
  await ensureAccountIndexes(db);
  return (await db
    .collection<AccountDoc>("accounts")
    .findOne({ email: email.toLowerCase() })) as AccountDoc | null;
}

export async function getAccountById(id: string): Promise<AccountDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return (await db
    .collection<AccountDoc>("accounts")
    .findOne({ _id: new ObjectId(id) })) as AccountDoc | null;
}

/** Throws `"email_taken"` if the address is already registered. */
export async function createAccount(input: SignupInput): Promise<AccountDoc> {
  const db = await getDb();
  await ensureAccountIndexes(db);

  const existing = await db.collection("accounts").findOne({ email: input.email });
  if (existing) throw new Error("email_taken");

  const { hash, salt } = await hashPassword(input.password);
  const now = new Date();
  const doc: Omit<AccountDoc, "_id"> = {
    email: input.email,
    fullName: input.fullName,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("accounts").insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/** `null` on any mismatch — deliberately the same answer for "no such email" and "wrong password". */
export async function verifyAccountCredentials(
  email: string,
  password: string,
): Promise<AccountDoc | null> {
  const account = await getAccountByEmail(email);
  if (!account) return null;
  const ok = await verifyPassword(password, account.passwordHash, account.passwordSalt);
  return ok ? account : null;
}
