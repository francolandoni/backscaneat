import { mysqlTable, int } from "drizzle-orm/mysql-core";
import { ordersTable } from "./orders";
import { menuItemsTable } from "./menuItems";

export const orderItemsTable = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").references(() => ordersTable.id),
  menuItemId: int("menu_item_id").references(() => menuItemsTable.id),
});

export type OrderItem = typeof orderItemsTable.$inferSelect;
