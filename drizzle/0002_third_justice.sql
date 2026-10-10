CREATE TABLE IF NOT EXISTS "wedding_documents" (
	"wedding_documents_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_documents_wedding_id" uuid NOT NULL,
	"wedding_documents_title" varchar(255) NOT NULL,
	"wedding_documents_for_party" varchar(30) DEFAULT 'wanita' NOT NULL,
	"wedding_documents_completed" boolean DEFAULT false NOT NULL,
	"wedding_documents_order" integer DEFAULT 0 NOT NULL,
	"wedding_documents_notes" text,
	"wedding_documents_due_date" date,
	"wedding_documents_created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"wedding_documents_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wedding_documents" ADD CONSTRAINT "wedding_documents_wedding_documents_wedding_id_wedding_weddings_wedding_weddings_id_fk" FOREIGN KEY ("wedding_documents_wedding_id") REFERENCES "public"."wedding_weddings"("wedding_weddings_id") ON DELETE cascade ON UPDATE no action;