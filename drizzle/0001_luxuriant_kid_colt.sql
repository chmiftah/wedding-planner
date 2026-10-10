CREATE TABLE "wedding_calendar_events" (
	"wedding_calendar_events_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_calendar_events_wedding_id" uuid NOT NULL,
	"wedding_calendar_events_title" varchar(200) NOT NULL,
	"wedding_calendar_events_date" date NOT NULL,
	"wedding_calendar_events_start_time" varchar(10),
	"wedding_calendar_events_end_time" varchar(10),
	"wedding_calendar_events_category" varchar(60) DEFAULT 'meeting' NOT NULL,
	"wedding_calendar_events_location" varchar(150),
	"wedding_calendar_events_notes" text,
	"wedding_calendar_events_completed" boolean DEFAULT false NOT NULL,
	"wedding_calendar_events_created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"wedding_calendar_events_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_rundowns" (
	"wedding_rundowns_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_rundowns_wedding_id" uuid NOT NULL,
	"wedding_rundowns_session" varchar(80) DEFAULT 'Akad Nikah' NOT NULL,
	"wedding_rundowns_start_time" varchar(10) NOT NULL,
	"wedding_rundowns_end_time" varchar(10) NOT NULL,
	"wedding_rundowns_title" varchar(200) NOT NULL,
	"wedding_rundowns_description" text,
	"wedding_rundowns_pic" varchar(100),
	"wedding_rundowns_location" varchar(150),
	"wedding_rundowns_order" integer DEFAULT 0 NOT NULL,
	"wedding_rundowns_created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"wedding_rundowns_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_vendors" (
	"wedding_vendors_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_vendors_wedding_id" uuid NOT NULL,
	"wedding_vendors_name" varchar(150) NOT NULL,
	"wedding_vendors_category" varchar(80) DEFAULT 'Lainnya' NOT NULL,
	"wedding_vendors_contact_person" varchar(100),
	"wedding_vendors_phone" varchar(50),
	"wedding_vendors_email" varchar(150),
	"wedding_vendors_instagram" varchar(100),
	"wedding_vendors_address" text,
	"wedding_vendors_status" varchar(50) DEFAULT 'riset' NOT NULL,
	"wedding_vendors_estimated_cost" bigint DEFAULT 0 NOT NULL,
	"wedding_vendors_actual_cost" bigint DEFAULT 0 NOT NULL,
	"wedding_vendors_notes" text,
	"wedding_vendors_created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"wedding_vendors_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wedding_users" ADD COLUMN IF NOT EXISTS "wedding_users_role" varchar(20) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "wedding_calendar_events" ADD CONSTRAINT "wedding_calendar_events_wedding_calendar_events_wedding_id_wedding_weddings_wedding_weddings_id_fk" FOREIGN KEY ("wedding_calendar_events_wedding_id") REFERENCES "public"."wedding_weddings"("wedding_weddings_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_rundowns" ADD CONSTRAINT "wedding_rundowns_wedding_rundowns_wedding_id_wedding_weddings_wedding_weddings_id_fk" FOREIGN KEY ("wedding_rundowns_wedding_id") REFERENCES "public"."wedding_weddings"("wedding_weddings_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wedding_vendors" ADD CONSTRAINT "wedding_vendors_wedding_vendors_wedding_id_wedding_weddings_wedding_weddings_id_fk" FOREIGN KEY ("wedding_vendors_wedding_id") REFERENCES "public"."wedding_weddings"("wedding_weddings_id") ON DELETE cascade ON UPDATE no action;