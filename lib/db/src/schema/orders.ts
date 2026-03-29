import { mysqlTable, int, varchar, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantTable } from "./restaurants";

export const ordersTable = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  date: datetime("date").default(sql`CURRENT_TIMESTAMP`),
  extraFields: varchar("extra_fields", { length: 255 }),
  restaurantId: int("restaurant_id").notNull().references(() => restaurantTable.id),
  tableNumber: int("table_number").notNull(),
  status: varchar("status", { length: 255 }),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, date: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
