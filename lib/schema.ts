// import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// export const users = pgTable("users", {
// id: uuid("id").defaultRandom().primaryKey(),
// clerkId: text("clerk_id").notNull().unique(),
//   email: text("email"),
//   name: text("name"),
//   createdAt: timestamp("created_at").defaultNow(),
// });

import { pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

/* ===================== USERS ===================== */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ===================== CHATS ===================== */

export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ===================== MESSAGES ===================== */

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),

  type: text("type").notNull().default("text"),
  fileName: text("file_name"),

  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 768 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
