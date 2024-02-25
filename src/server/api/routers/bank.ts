import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { banks } from "~/server/db/schema";
import { z } from "zod";
import { get } from "https";
import { env } from "~/env";

const tellerAccountResponse = z.object({
  enrollment_id: z.string(),
  links: z.object({
    balances: z.string(),
    self: z.string(),
    transactions: z.string(),
  }),
  institution: z.object({
    name: z.string(),
    id: z.string(),
  }),
  type: z.string(),
  name: z.string(),
  subtype: z.string(),
  currency: z.string(),
  id: z.string(),
  last_four: z.string(),
  status: z.string(),
});

const tellerAccountResponseArray = z.array(tellerAccountResponse);

export type TellerAccountResponse = z.infer<typeof tellerAccountResponse>;

export const bankRouter = createTRPCRouter({
	get: protectedProcedure
		.query(({ ctx }) => {
      return ctx.db.query.banks.findFirst({
        where: eq(banks.userId, ctx.session.user.id)
      })
		}),
  create: protectedProcedure
    .input(z.object({
      accessToken: z.string(),
      userId: z.string(),
      enrollmentId: z.string(),
      institutionName: z.string(),
    }))
    .mutation(({ ctx, input })  => {
      return ctx.db.insert(banks).values({
        id: input.enrollmentId,
        userId: ctx.session.user.id,
        accessToken: input.accessToken,
        bankUserId: input.userId,
        enrollmentId: input.enrollmentId,
        institutionName: input.institutionName,
      })
    }),
  syncAccounts: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: mTLS with certs and key
      // TODO: Add basic auth (i.e., base64(access_token:))
      const bank = await ctx.db.query.banks.findFirst({
        where: eq(banks.userId, ctx.session.user.id)
      });

      if (!bank) {
        throw new Error('Bank not found');
      }

      const authorization = Buffer.from(`${bank.accessToken}:`).toString('base64');

      const result = await new Promise<TellerAccountResponse[]>((resolve, reject) => {
        const req = get({
          hostname: env.TELLER_BASE_URL,
          port: 443, 
          method: 'GET',
          path: '/accounts',
          cert: ctx.teller.cert,
          key: ctx.teller.key,
          headers: {
            'Authorization': `Basic ${authorization}`
          }
        }, (res) => {
          res.on('data', (data: Buffer) => {
            resolve(tellerAccountResponseArray.parse(JSON.parse(data.toString())));
          });

          res.on('error', (error) => {
            reject(error)
          });
        });

        req.end();
      });

      return result; 
    }),
});
