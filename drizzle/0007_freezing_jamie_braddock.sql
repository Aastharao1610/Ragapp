CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_chunks" RENAME TO "documents";--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "content" TO "cloudinary_id";--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "embedding" TO "status";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "document_chunks_chat_id_chats_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;