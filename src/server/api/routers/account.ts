import { eq } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const accountRouter = createTRPCRouter({
	list: protectedProcedure
		.query(({ ctx }) => {
			return ctx.db.query.users.findFirst({
				where: eq(users.id, ctx.session.user.id),
				with: {
					accounts: true,
				}
			})
		}),
});
