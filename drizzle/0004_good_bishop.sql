ALTER TABLE "chats" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "user_id" text NOT NULL;