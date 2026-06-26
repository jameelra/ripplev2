import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  licenseTier: mysqlEnum("licenseTier", ["Free", "Pro", "Premier"]).default("Free").notNull(),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  vaultType: mysqlEnum("vaultType", ["ambient", "pin"]).default("ambient"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Encrypted vault blobs — server stores only ciphertext, never plaintext health data
export const vaultBlobs = mysqlTable("vault_blobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  blobKey: varchar("blobKey", { length: 128 }).notNull(), // e.g. "day_logs", "cycle_events"
  encryptedData: text("encryptedData").notNull(), // JSON: { iv: string, data: string }
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VaultBlob = typeof vaultBlobs.$inferSelect;
export type InsertVaultBlob = typeof vaultBlobs.$inferInsert;

// Feedback table for the co-pilot feedback hub
export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }),
  rating: int("rating").notNull(),
  category: varchar("category", { length: 64 }),
  feedbackText: text("feedbackText"),
  consentResearch: boolean("consentResearch").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;
