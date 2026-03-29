import { pgTable, bigserial, text, bigint, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";

export const ordersTable = pgTable("orders", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  extraFields: text("extra_fields"),
  restaurantId: bigint("restaurant_id", { mode: "bigint" }).notNull().references(() => restaurantsTable.id),
  tableNumber: bigint("table_number", { mode: "bigint" }).notNull(),
  status: text("status").notNull().default("PENDING"),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, date: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
