import { type InferInsertModel, desc, eq, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  bankAccounts,
  banks,
  counterparty,
  transactions,
} from "~/server/db/schema";
import { z } from "zod";
import { type ListTransactionsOpts } from "~/server/teller/client";
import { randomUUID } from "crypto";

export const bankRouter = createTRPCRouter({
  get: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.banks.findFirst({
      where: eq(banks.userId, ctx.session.user.id),
    });
  }),
  create: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
        userId: z.string(),
        enrollmentId: z.string(),
        institutionName: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(banks).values({
        id: input.enrollmentId,
        userId: ctx.session.user.id,
        accessToken: input.accessToken,
        bankUserId: input.userId,
        enrollmentId: input.enrollmentId,
        institutionName: input.institutionName,
      });
    }),
  listAccounts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.banks.findFirst({
      where: eq(banks.userId, ctx.session.user.id),
      with: {
        accounts: true,
      },
    });
  }),
  syncAccounts: protectedProcedure.mutation(async ({ ctx }) => {
    const bank = await ctx.db.query.banks.findFirst({
      where: eq(banks.userId, ctx.session.user.id),
    });

    if (!bank) {
      throw new Error("Bank not found");
    }

    const accounts = await ctx.tellerClient.listAccounts(bank.accessToken);

    return ctx.db.insert(bankAccounts).values(
      accounts.map((account) => ({
        id: account.id,
        userId: ctx.session.user.id,
        bankId: bank.id,
        type: account.type,
        name: account.name,
        subType: account.subtype,
        currency: account.currency,
        lastFour: account.last_four,
        status: account.status,
      })),
    );
  }),

  listTransactions: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.transactions.findMany({
        limit: input.limit,
        offset: input.offset,
        where: eq(transactions.bankAccountId, input.accountId),
        orderBy: [desc(transactions.date)],
        with: {
          counterparty: true,
        },
      });
    }),

  syncTransactions: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const bank = await ctx.db.query.banks.findFirst({
        where: eq(banks.userId, ctx.session.user.id),
      });

      if (!bank) {
        throw new Error("Bank not found");
      }

      const mostRecentTransaction = await ctx.db.query.transactions.findFirst({
        where: eq(transactions.bankAccountId, input.accountId),
        orderBy: [desc(transactions.date)],
      });

      const allCounterParties = await ctx.db.query.counterparty.findMany({
        where: eq(counterparty.userId, ctx.session.user.id),
      });

      const counterPartyLookup: Record<
        string,
        InferInsertModel<typeof counterparty>
      > = {};
      for (const cp of allCounterParties) {
        counterPartyLookup[cp.name] = cp;
      }

      if (mostRecentTransaction) {
        let hasMore = true;
        const options: ListTransactionsOpts = {
          count: "100",
        };

        while (hasMore) {
          const remoteTransactions = await ctx.tellerClient.listTransactions(
            bank.accessToken,
            input.accountId,
            options,
          );

          const newCounterParties: InferInsertModel<typeof counterparty>[] = [];
          const newTransactions = [];
          for (const transaction of remoteTransactions) {
            const d = new Date(transaction.date);
            if (d < mostRecentTransaction.date) {
              hasMore = false;
              break;
            }

            const cpname = transaction.details?.counterparty?.name ?? "unknown";
            const cptype = transaction.details?.counterparty?.type ?? "unknown";

            if (!counterPartyLookup[cpname]) {
              const newCP = {
                id: randomUUID(),
                userId: ctx.session.user.id,
                name: cpname,
                type: cptype,
              };

              newCounterParties.push(newCP);
              counterPartyLookup[cpname] = newCP;
            }

            newTransactions.push(transaction);
            options.from_id = transaction.id;
          }

          await ctx.db
            .insert(counterparty)
            .values(newCounterParties)
            .onDuplicateKeyUpdate({ set: { id: sql`id` } });

          await ctx.db
            .insert(transactions)
            .values(
              newTransactions.map((transaction) => ({
                id: transaction.id,
                userId: ctx.session.user.id,
                bankAccountId: transaction.account_id,
                description: transaction.description,
                amount: parseFloat(transaction.amount),
                date: new Date(transaction.date),
                type: transaction.type,
                status: transaction.status,
                counterPartyId:
                  counterPartyLookup[
                    transaction.details?.counterparty?.name ?? "unknown"
                  ]?.id ?? "",
              })),
            )
            .onDuplicateKeyUpdate({ set: { id: sql`id` } });
        }
      } else {
        const remoteTransactions = await ctx.tellerClient.listTransactions(
          bank.accessToken,
          input.accountId,
          {
            count: "2000",
          },
        );

        const newCounterParties: InferInsertModel<typeof counterparty>[] = [];
        for (const transaction of remoteTransactions) {
          const cpname = transaction.details?.counterparty?.name ?? "unknown";
          const cptype = transaction.details?.counterparty?.type ?? "unknown";

          if (!counterPartyLookup[cpname]) {
            const newCP = {
              id: randomUUID(),
              userId: ctx.session.user.id,
              name: cpname,
              type: cptype,
            };

            newCounterParties.push(newCP);
            counterPartyLookup[cpname] = newCP;
          }
        }

        await ctx.db
          .insert(counterparty)
          .values(newCounterParties)
          .onDuplicateKeyUpdate({ set: { id: sql`id` } });

        await ctx.db.insert(transactions).values(
          remoteTransactions.map((transaction) => ({
            id: transaction.id,
            userId: ctx.session.user.id,
            bankAccountId: transaction.account_id,
            description: transaction.description,
            amount: parseFloat(transaction.amount),
            date: new Date(transaction.date),
            type: transaction.type,
            status: transaction.status,
            counterPartyId:
              counterPartyLookup[
                transaction.details?.counterparty?.name ?? "unknown"
              ]?.id ?? "",
          })),
        );
      }
    }),
});
