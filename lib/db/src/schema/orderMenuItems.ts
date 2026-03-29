import { pgTable, bigint, primaryKey } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { menuItemsTable } from "./menuItems";

export const orderMenuItemsTable = pgTable(
  "order_menu_items",
  {
    orderId: bigint("order_id", { mode: "bigint" }).notNull().references(() => ordersTable.id),
    menuItemId: bigint("menu_item_id", { mode: "bigint" }).notNull().references(() => menuItemsTable.id),
  },
  (table) => [primaryKey({ columns: [table.orderId, table.menuItemId] })]
);

export type OrderMenuItem = typeof orderMenuItemsTable.$inferSelect;
