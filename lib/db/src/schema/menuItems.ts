import { mysqlTable, int, varchar, float, boolean } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantTable } from "./restaurants";

export const menuItemsTable = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: float("price").notNull(),
  description: varchar("description", { length: 255 }),
  available: boolean("available").notNull(),
  subgroup: varchar("SUBGROUP", { length: 255 }),
  restaurantId: int("restaurant_id").notNull().references(() => restaurantTable.id),
});

export const insertMenuItemSchema = createInsertSchema(menuItemsTable).omit({ id: true });
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItemsTable.$inferSelect;
