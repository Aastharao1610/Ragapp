import { pgTable, PgTable ,text,timestamp,uuid } from "drizzle-orm/pg-core";

export const chats=pgTable("chats",{
    id :uuid("id").defaultRandom().primaryKey(),
    createdAt :timestamp("created_at").defaultNow().notNull(),


})
export const messages =pgTable("messages" ,{
  id :uuid("id").defaultRandom().primaryKey(),
  chatId :uuid("chat_id")
     .references(()=>chats.id ,{onDelete : "cascade"})
     .notNull(),
     role : text("role").notNull(),
     content :text("content").notNull(),
     createdAt :timestamp("created_at").defaultNow().notNull(),
})