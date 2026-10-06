CREATE TABLE "wedding_budget_categories" (
	"wedding_budget_categories_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_budget_categories_wedding_id" uuid NOT NULL,
	"wedding_budget_categories_name" varchar(100) NOT NULL,
	"wedding_budget_categories_color" varchar(30) DEFAULT '#C9847A',
	"wedding_budget_categories_icon" varchar(50) DEFAULT 'catering',
	"wedding_budget_categories_order" integer DEFAULT 0 NOT NULL,
	"wedding_budget_categories_created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_budget_items" (
	"wedding_budget_items_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_budget_items_category_id" uuid NOT NULL,
	"wedding_budget_items_name" varchar(150) NOT NULL,
	"wedding_budget_items_quantity" integer DEFAULT 1 NOT NULL,
	"wedding_budget_items_unit" varchar(50) DEFAULT 'paket' NOT NULL,
	"wedding_budget_items_unit_price" bigint DEFAULT 0 NOT NULL,
	"wedding_budget_items_vendor_name" varchar(150),
	"wedding_budget_items_notes" text,
	"wedding_budget_items_created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_checklist_items" (
	"wedding_checklist_items_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_checklist_items_wedding_id" uuid NOT NULL,
	"wedding_checklist_items_text" varchar(255) NOT NULL,
	"wedding_checklist_items_due_date" date,
	"wedding_checklist_items_assignee" varchar(50),
	"wedding_checklist_items_completed" boolean DEFAULT false NOT NULL,
	"wedding_checklist_items_category" varchar(50) DEFAULT 'Umum' NOT NULL,
	"wedding_checklist_items_notes" text,
	"wedding_checklist_items_created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_funding_sources" (
	"wedding_funding_sources_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_funding_sources_wedding_id" uuid NOT NULL,
	"wedding_funding_sources_type" varchar(50) DEFAULT 'tabungan_sendiri' NOT NULL,
	"wedding_funding_sources_name" varchar(100) NOT NULL,
	"wedding_funding_sources_confirmed_amount" bigint DEFAULT 0 NOT NULL,
	"wedding_funding_sources_is_estimate" boolean DEFAULT false NOT NULL,
	"wedding_funding_sources_notes" text,
	"wedding_funding_sources_created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_guests" (
	"wedding_guests_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_guests_wedding_id" uuid NOT NULL,
	"wedding_guests_name" varchar(100) NOT NULL,
	"wedding_guests_phone" varchar(50),
	"wedding_guests_email" varchar(150),
	"wedding_guests_category" varchar(50) DEFAULT 'teman' NOT NULL,
	"wedding_guests_rsvp_token" varchar(64) NOT NULL,
	"wedding_guests_rsvp_status" varchar(30) DEFAULT 'pending' NOT NULL,
	"wedding_guests_guest_count" integer DEFAULT 1 NOT NULL,
	"wedding_guests_rsvp_message" text,
	"wedding_guests_rsvp_responded_at" timestamp with time zone,
	"wedding_guests_created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_guests_wedding_guests_rsvp_token_unique" UNIQUE("wedding_guests_rsvp_token")
);
--> statement-breakpoint
CREATE TABLE "wedding_invitations" (
	"wedding_invitations_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_invitations_wedding_id" uuid NOT NULL,
	"wedding_invitations_slug" varchar(100) NOT NULL,
	"wedding_invitations_theme" varchar(50) DEFAULT 'romantic_terracotta' NOT NULL,
	"wedding_invitations_config" jsonb NOT NULL,
	"wedding_invitations_created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"wedding_invitations_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_invitations_wedding_invitations_wedding_id_unique" UNIQUE("wedding_invitations_wedding_id"),
	CONSTRAINT "wedding_invitations_wedding_invitations_slug_unique" UNIQUE("wedding_invitations_slug")
);
--> statement-breakpoint
CREATE TABLE "wedding_payments" (
	"wedding_payments_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_payments_budget_item_id" uuid NOT NULL,
	"wedding_payments_amount" bigint NOT NULL,
	"wedding_payments_payment_date" date NOT NULL,
	"wedding_payments_type" varchar(30) DEFAULT 'dp' NOT NULL,
	"wedding_payments_proof_url" text,
	"wedding_payments_notes" text,
	"wedding_payments_created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_savings_entries" (
	"wedding_savings_entries_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_savings_entries_funding_source_id" uuid NOT NULL,
	"wedding_savings_entries_amount" bigint NOT NULL,
	"wedding_savings_entries_entry_date" date NOT NULL,
	"wedding_savings_entries_notes" text,
	"wedding_savings_entries_created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_users" (
	"wedding_users_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_users_email" varchar(255) NOT NULL,
	"wedding_users_password_hash" text NOT NULL,
	"wedding_users_name" varchar(100) NOT NULL,
	"wedding_users_created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"wedding_users_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wedding_users_wedding_users_email_unique" UNIQUE("wedding_users_email")
);
--> statement-breakpoint
CREATE TABLE "wedding_weddings" (
	"wedding_weddings_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_weddings_user_id" uuid NOT NULL,
	"wedding_weddings_bride_name" varchar(100),
	"wedding_weddings_groom_name" varchar(100),
	"wedding_weddings_wedding_date" date,
	"wedding_weddings_date_note" text,
	"wedding_weddings_venue_type" varchar(50) DEFAULT 'gedung',
	"wedding_weddings_style" varchar(50) DEFAULT 'menengah',
	"wedding_weddings_guest_count" integer DEFAULT 100 NOT NULL,
	"wedding_weddings_total_budget" bigint DEFAULT 0 NOT NULL,
	"wedding_weddings_monthly_savings_target" bigint DEFAULT 0 NOT NULL,
	"wedding_weddings_wizard_completed" boolean DEFAULT false NOT NULL,
	"wedding_weddings_created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"wedding_weddings_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wedding_budget_categories" ADD CONSTRAINT "wedding_budget_categories_wedding_budget_categories_wedding_id_wedding_weddings_wedding_weddings_id_fk" FOREIGN KEY ("wedding_budget_categories_wedding_id") REFERENCES "public"."wedding_weddings"("wedding_weddings_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_budget_items" ADD CONSTRAINT "wedding_budget_items_wedding_budget_items_category_id_wedding_budget_categories_wedding_budget_categories_id_fk" FOREIGN KEY ("wedding_budget_items_category_id") REFERENCES "public"."wedding_budget_categories"("wedding_budget_categories_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_checklist_items" ADD CONSTRAINT "wedding_checklist_items_wedding_checklist_items_wedding_id_wedding_weddings_wedding_weddings_id_fk" FOREIGN KEY ("wedding_checklist_items_wedding_id") REFERENCES "public"."wedding_weddings"("wedding_weddings_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_funding_sources" ADD CONSTRAINT "wedding_funding_sources_wedding_funding_sources_wedding_id_wedding_weddings_wedding_weddings_id_fk" FOREIGN KEY ("wedding_funding_sources_wedding_id") REFERENCES "public"."wedding_weddings"("wedding_weddings_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_guests" ADD CONSTRAINT "wedding_guests_wedding_guests_wedding_id_wedding_weddings_wedding_weddings_id_fk" FOREIGN KEY ("wedding_guests_wedding_id") REFERENCES "public"."wedding_weddings"("wedding_weddings_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_invitations" ADD CONSTRAINT "wedding_invitations_wedding_invitations_wedding_id_wedding_weddings_wedding_weddings_id_fk" FOREIGN KEY ("wedding_invitations_wedding_id") REFERENCES "public"."wedding_weddings"("wedding_weddings_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_payments" ADD CONSTRAINT "wedding_payments_wedding_payments_budget_item_id_wedding_budget_items_wedding_budget_items_id_fk" FOREIGN KEY ("wedding_payments_budget_item_id") REFERENCES "public"."wedding_budget_items"("wedding_budget_items_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_savings_entries" ADD CONSTRAINT "wedding_savings_entries_wedding_savings_entries_funding_source_id_wedding_funding_sources_wedding_funding_sources_id_fk" FOREIGN KEY ("wedding_savings_entries_funding_source_id") REFERENCES "public"."wedding_funding_sources"("wedding_funding_sources_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_weddings" ADD CONSTRAINT "wedding_weddings_wedding_weddings_user_id_wedding_users_wedding_users_id_fk" FOREIGN KEY ("wedding_weddings_user_id") REFERENCES "public"."wedding_users"("wedding_users_id") ON DELETE cascade ON UPDATE no action;