// import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// export const users = pgTable("users", {
// id: uuid("id").defaultRandom().primaryKey(),
// clerkId: text("clerk_id").notNull().unique(),
//   email: text("email"),
//   name: text("name"),
//   createdAt: timestamp("created_at").defaultNow(),
// });

import { pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";


export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),          // uuid
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

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


export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),

  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),

  userId: text("user_id").notNull(),

  fileName: text("file_name").notNull(),

  fileUrl: text("file_url").notNull(), // 👈 Cloudinary URL

  cloudinaryId: text("cloudinary_id").notNull(),

  status: text("status").notNull().default("uploaded"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
