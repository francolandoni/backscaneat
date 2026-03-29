import { pgTable, bigserial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantsTable = pgTable("restaurants", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  name: text("name").notNull(),
});

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({ id: true });
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurantsTable.$inferSelect;
