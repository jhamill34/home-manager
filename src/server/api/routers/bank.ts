import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { banks } from "~/server/db/schema";
import { z } from "zod";

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
});
