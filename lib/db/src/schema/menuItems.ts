import { pgTable, bigserial, text, numeric, boolean, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";

export const menuItemsTable = pgTable("menu_items", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  available: boolean("available").notNull().default(true),
  restaurantId: bigint("restaurant_id", { mode: "bigint" }).notNull().references(() => restaurantsTable.id),
  subgroup: text("subgroup"),
});

export const insertMenuItemSchema = createInsertSchema(menuItemsTable).omit({ id: true });
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItemsTable.$inferSelect;
