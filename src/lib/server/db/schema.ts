import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// 1. USERS TABLE
// ============================================================================
export const users = pgTable('wedding_users', {
  id: uuid('wedding_users_id').defaultRandom().primaryKey(),
  email: varchar('wedding_users_email', { length: 255 }).unique().notNull(),
  passwordHash: text('wedding_users_password_hash').notNull(),
  name: varchar('wedding_users_name', { length: 100 }).notNull(),
  role: varchar('wedding_users_role', { length: 20 }).default('user').notNull(),
  createdAt: timestamp('wedding_users_created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('wedding_users_updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 2. WEDDINGS TABLE
// ============================================================================
export const weddings = pgTable('wedding_weddings', {
  id: uuid('wedding_weddings_id').defaultRandom().primaryKey(),
  userId: uuid('wedding_weddings_user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  brideName: varchar('wedding_weddings_bride_name', { length: 100 }),
  groomName: varchar('wedding_weddings_groom_name', { length: 100 }),
  weddingDate: date('wedding_weddings_wedding_date'),
  dateNote: text('wedding_weddings_date_note'),
  venueType: varchar('wedding_weddings_venue_type', { length: 50 }).default('gedung'),
  style: varchar('wedding_weddings_style', { length: 50 }).default('menengah'),
  guestCount: integer('wedding_weddings_guest_count').default(100).notNull(),
  totalBudget: bigint('wedding_weddings_total_budget', { mode: 'number' }).default(0).notNull(),
  monthlySavingsTarget: bigint('wedding_weddings_monthly_savings_target', { mode: 'number' }).default(0).notNull(),
  wizardCompleted: boolean('wedding_weddings_wizard_completed').default(false).notNull(),
  createdAt: timestamp('wedding_weddings_created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('wedding_weddings_updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 3. BUDGET CATEGORIES TABLE
// ============================================================================
export const budgetCategories = pgTable('wedding_budget_categories', {
  id: uuid('wedding_budget_categories_id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_budget_categories_wedding_id')
    .references(() => weddings.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('wedding_budget_categories_name', { length: 100 }).notNull(),
  color: varchar('wedding_budget_categories_color', { length: 30 }).default('#C9847A'),
  icon: varchar('wedding_budget_categories_icon', { length: 50 }).default('catering'),
  order: integer('wedding_budget_categories_order').default(0).notNull(),
  createdAt: timestamp('wedding_budget_categories_created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 4. BUDGET ITEMS TABLE
// ============================================================================
export const budgetItems = pgTable('wedding_budget_items', {
  id: uuid('wedding_budget_items_id').defaultRandom().primaryKey(),
  categoryId: uuid('wedding_budget_items_category_id')
    .references(() => budgetCategories.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('wedding_budget_items_name', { length: 150 }).notNull(),
  quantity: integer('wedding_budget_items_quantity').default(1).notNull(),
  unit: varchar('wedding_budget_items_unit', { length: 50 }).default('paket').notNull(),
  unitPrice: bigint('wedding_budget_items_unit_price', { mode: 'number' }).default(0).notNull(),
  vendorName: varchar('wedding_budget_items_vendor_name', { length: 150 }),
  notes: text('wedding_budget_items_notes'),
  createdAt: timestamp('wedding_budget_items_created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 5. PAYMENTS TABLE
// ============================================================================
export const payments = pgTable('wedding_payments', {
  id: uuid('wedding_payments_id').defaultRandom().primaryKey(),
  budgetItemId: uuid('wedding_payments_budget_item_id')
    .references(() => budgetItems.id, { onDelete: 'cascade' })
    .notNull(),
  amount: bigint('wedding_payments_amount', { mode: 'number' }).notNull(),
  paymentDate: date('wedding_payments_payment_date').notNull(),
  type: varchar('wedding_payments_type', { length: 30 }).default('dp').notNull(), // 'dp' | 'termin' | 'lunas'
  proofUrl: text('wedding_payments_proof_url'),
  notes: text('wedding_payments_notes'),
  createdAt: timestamp('wedding_payments_created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 6. FUNDING SOURCES TABLE
// ============================================================================
export const fundingSources = pgTable('wedding_funding_sources', {
  id: uuid('wedding_funding_sources_id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_funding_sources_wedding_id')
    .references(() => weddings.id, { onDelete: 'cascade' })
    .notNull(),
  type: varchar('wedding_funding_sources_type', { length: 50 }).default('tabungan_sendiri').notNull(),
  name: varchar('wedding_funding_sources_name', { length: 100 }).notNull(),
  confirmedAmount: bigint('wedding_funding_sources_confirmed_amount', { mode: 'number' }).default(0).notNull(),
  isEstimate: boolean('wedding_funding_sources_is_estimate').default(false).notNull(),
  notes: text('wedding_funding_sources_notes'),
  createdAt: timestamp('wedding_funding_sources_created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 7. SAVINGS ENTRIES TABLE
// ============================================================================
export const savingsEntries = pgTable('wedding_savings_entries', {
  id: uuid('wedding_savings_entries_id').defaultRandom().primaryKey(),
  fundingSourceId: uuid('wedding_savings_entries_funding_source_id')
    .references(() => fundingSources.id, { onDelete: 'cascade' })
    .notNull(),
  amount: bigint('wedding_savings_entries_amount', { mode: 'number' }).notNull(),
  entryDate: date('wedding_savings_entries_entry_date').notNull(),
  notes: text('wedding_savings_entries_notes'),
  createdAt: timestamp('wedding_savings_entries_created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 8. GUESTS TABLE
// ============================================================================
export const guests = pgTable('wedding_guests', {
  id: uuid('wedding_guests_id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_guests_wedding_id')
    .references(() => weddings.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('wedding_guests_name', { length: 100 }).notNull(),
  phone: varchar('wedding_guests_phone', { length: 50 }),
  email: varchar('wedding_guests_email', { length: 150 }),
  category: varchar('wedding_guests_category', { length: 50 }).default('teman').notNull(),
  rsvpToken: varchar('wedding_guests_rsvp_token', { length: 64 }).unique().notNull(),
  rsvpStatus: varchar('wedding_guests_rsvp_status', { length: 30 }).default('pending').notNull(),
  guestCount: integer('wedding_guests_guest_count').default(1).notNull(),
  rsvpMessage: text('wedding_guests_rsvp_message'),
  rsvpRespondedAt: timestamp('wedding_guests_rsvp_responded_at', { withTimezone: true }),
  createdAt: timestamp('wedding_guests_created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 9. CHECKLIST ITEMS TABLE
// ============================================================================
export const checklistItems = pgTable('wedding_checklist_items', {
  id: uuid('wedding_checklist_items_id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_checklist_items_wedding_id')
    .references(() => weddings.id, { onDelete: 'cascade' })
    .notNull(),
  text: varchar('wedding_checklist_items_text', { length: 255 }).notNull(),
  dueDate: date('wedding_checklist_items_due_date'),
  assignee: varchar('wedding_checklist_items_assignee', { length: 50 }),
  completed: boolean('wedding_checklist_items_completed').default(false).notNull(),
  category: varchar('wedding_checklist_items_category', { length: 50 }).default('Umum').notNull(),
  notes: text('wedding_checklist_items_notes'),
  createdAt: timestamp('wedding_checklist_items_created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// 10. DIGITAL INVITATIONS TABLE
// ============================================================================
export const invitations = pgTable('wedding_invitations', {
  id: uuid('wedding_invitations_id').defaultRandom().primaryKey(),
  weddingId: uuid('wedding_invitations_wedding_id')
    .references(() => weddings.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  slug: varchar('wedding_invitations_slug', { length: 100 }).unique().notNull(),
  theme: varchar('wedding_invitations_theme', { length: 50 }).default('romantic_terracotta').notNull(),
  config: jsonb('wedding_invitations_config').notNull(),
  createdAt: timestamp('wedding_invitations_created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('wedding_invitations_updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================
export const usersRelations = relations(users, ({ many }) => ({
  weddings: many(weddings),
}));

export const weddingsRelations = relations(weddings, ({ one, many }) => ({
  user: one(users, {
    fields: [weddings.userId],
    references: [users.id],
  }),
  budgetCategories: many(budgetCategories),
  fundingSources: many(fundingSources),
  guests: many(guests),
  checklistItems: many(checklistItems),
  invitation: one(invitations, {
    fields: [weddings.id],
    references: [invitations.weddingId],
  }),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [budgetCategories.weddingId],
    references: [weddings.id],
  }),
  items: many(budgetItems),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one, many }) => ({
  category: one(budgetCategories, {
    fields: [budgetItems.categoryId],
    references: [budgetCategories.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  budgetItem: one(budgetItems, {
    fields: [payments.budgetItemId],
    references: [budgetItems.id],
  }),
}));

export const fundingSourcesRelations = relations(fundingSources, ({ one, many }) => ({
  wedding: one(weddings, {
    fields: [fundingSources.weddingId],
    references: [weddings.id],
  }),
  savingsEntries: many(savingsEntries),
}));

export const savingsEntriesRelations = relations(savingsEntries, ({ one }) => ({
  fundingSource: one(fundingSources, {
    fields: [savingsEntries.fundingSourceId],
    references: [fundingSources.id],
  }),
}));

export const guestsRelations = relations(guests, ({ one }) => ({
  wedding: one(weddings, {
    fields: [guests.weddingId],
    references: [weddings.id],
  }),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  wedding: one(weddings, {
    fields: [checklistItems.weddingId],
    references: [weddings.id],
  }),
}));
