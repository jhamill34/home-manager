import { relations, sql } from "drizzle-orm";
import {
  index,
  int,
  mysqlTableCreator,
  primaryKey,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = mysqlTableCreator((name) => `home-manager_${name}`);

export const banks = createTable("bank", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  accessToken: varchar("accessToken", { length: 255 }).notNull(),
  bankUserId: varchar("bankUserId", { length: 255 }).notNull(),
  enrollmentId: varchar("enrollmentId", { length: 255 }).notNull(),
  institutionName: varchar("bankName", { length: 255 }).notNull(),
});

export const banksRelations = relations(banks, ({ one, many }) => ({
  user: one(users, { fields: [banks.userId], references: [users.id] }),
  accounts: many(bankAccounts),
}));

export const bankAccounts = createTable("bank_account", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  bankId: varchar("bankId", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subType: varchar("subType", { length: 255 }).notNull(),
  currency: varchar("currency", { length: 255 }).notNull(),
  lastFour: varchar("lastFour", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).notNull(),
});

export const bankAccountsRelations = relations(
  bankAccounts,
  ({ one, many }) => ({
    bank: one(banks, { fields: [bankAccounts.bankId], references: [banks.id] }),
    user: one(users, { fields: [bankAccounts.userId], references: [users.id] }),
    transactions: many(transactions),
  }),
);

export const transactions = createTable("transaction", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  bankAccountId: varchar("bankAccountId", { length: 255 }).notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  counterPartyId: varchar("counterPartyId", { length: 255 }).notNull(),

  note: text("note"),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  counterparty: one(counterparty, {
    fields: [transactions.counterPartyId],
    references: [counterparty.id],
  }),
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  bankAccount: one(bankAccounts, {
    fields: [transactions.bankAccountId],
    references: [bankAccounts.id],
  }),
}));

export const counterparty = createTable("counterparty", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),

  categoryId: varchar("categoryId", { length: 255 }),
});

export const counterpartyRelations = relations(
  counterparty,
  ({ one, many }) => ({
    transactions: many(transactions),
    user: one(users, { fields: [counterparty.userId], references: [users.id] }),
    category: one(category, {
      fields: [counterparty.categoryId],
      references: [category.id],
    }),
  }),
);

export const category = createTable("category", {
  id: int("id").notNull().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const categoryRelations = relations(category, ({ one, many }) => ({
  counterparties: many(counterparty),
  user: one(users, { fields: [category.userId], references: [users.id] }),
}));

export const users = createTable("user", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    fsp: 3,
  }).default(sql`CURRENT_TIMESTAMP(3)`),
  image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  bank: many(banks),
  bankAccounts: many(bankAccounts),
  counterparties: many(counterparty),
  sessions: many(sessions),
  transactions: many(transactions),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("userId", { length: 255 }).notNull(),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    refresh_token_expires_in: int("refresh_token_expires_in"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("accounts_userId_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_userId_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);
