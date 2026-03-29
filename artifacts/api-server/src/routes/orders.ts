import { Router, type IRouter } from "express";
import { db, eq, desc } from "@workspace/db";
import { ordersTable, menuItemsTable, orderItemsTable, restaurantTable } from "@workspace/db/schema";
import { sseNotifyOrder } from "../lib/sse";

const router: IRouter = Router();

async function getOrderWithDetails(orderId: number) {
  const [order] = await db
    .select()
    .from(ordersTable)
    .leftJoin(restaurantTable, eq(ordersTable.restaurantId, restaurantTable.id))
    .where(eq(ordersTable.id, orderId));

  if (!order) return null;

  const menuItemRows = await db
    .select({ menuItems: menuItemsTable })
    .from(orderItemsTable)
    .leftJoin(menuItemsTable, eq(orderItemsTable.menuItemId, menuItemsTable.id))
    .where(eq(orderItemsTable.orderId, orderId));

  return {
    id: order.orders.id,
    date: order.orders.date,
    extra_fields: order.orders.extraFields ?? null,
    table_number: order.orders.tableNumber,
    status: order.orders.status,
    restaurant: order.restaurant
      ? { restaurant_id: order.restaurant.id, name: order.restaurant.name }
      : { restaurant_id: 0, name: "" },
    menu_items: menuItemRows
      .filter((r) => r.menuItems !== null)
      .map((r) => ({
        id: r.menuItems!.id,
        name: r.menuItems!.name,
        price: r.menuItems!.price,
        description: r.menuItems!.description ?? null,
        available: r.menuItems!.available,
        subgroup: r.menuItems!.subgroup ?? null,
        image_url: r.menuItems!.imageUrl ?? null,
      })),
  };
}

router.get("/orders/:orderId", async (req, res) => {
  const orderId = Number(req.params.orderId);
  try {
    const order = await getOrderWithDetails(orderId);
    if (!order) {
      res.status(204).send();
      return;
    }
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Error fetching order");
    res.status(400).json({ message: "Error al obtener la orden" });
  }
});

router.get("/orders/last/:restaurantId", async (req, res) => {
  const restaurantId = Number(req.params.restaurantId);
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.restaurantId, restaurantId))
      .orderBy(desc(ordersTable.date))
      .limit(50);

    if (orders.length === 0) {
      res.status(204).send();
      return;
    }

    const detailed = await Promise.all(orders.map((o) => getOrderWithDetails(o.id)));
    res.json(detailed.filter(Boolean));
  } catch (err) {
    req.log.error({ err }, "Error fetching last orders");
    res.status(400).json({ message: "Error al obtener las órdenes" });
  }
});

router.post("/orders", async (req, res) => {
  const body = req.body as {
    restaurant_id: number;
    menu_items_ids: number[];
    extra_fields?: string;
    table_number: number;
  };

  try {
    if (!body.restaurant_id || !body.menu_items_ids || body.table_number == null) {
      res.status(400).json({ message: "Faltan campos requeridos" });
      return;
    }

    const [result] = await db.insert(ordersTable).values({
      restaurantId: body.restaurant_id,
      tableNumber: body.table_number,
      extraFields: body.extra_fields ?? null,
      status: "PENDING",
    });

    const orderId = result.insertId;

    if (body.menu_items_ids.length > 0) {
      await db.insert(orderItemsTable).values(
        body.menu_items_ids.map((itemId) => ({
          orderId,
          menuItemId: itemId,
        }))
      );
    }

    const detailed = await getOrderWithDetails(orderId);
    if (!detailed) {
      res.status(400).send();
      return;
    }

    sseNotifyOrder(detailed);
    res.status(201).json(detailed);
  } catch (err) {
    req.log.error({ err }, "Error creating order");
    res.status(400).json({ message: "Error al crear la orden" });
  }
});

router.put("/orders/:orderId/status", async (req, res) => {
  const orderId = Number(req.params.orderId);
  const body = req.body as { status: string };

  try {
    await db
      .update(ordersTable)
      .set({ status: body.status })
      .where(eq(ordersTable.id, orderId));

    const detailed = await getOrderWithDetails(orderId);
    if (!detailed) {
      res.status(400).send();
      return;
    }

    sseNotifyOrder(detailed);
    res.json(detailed);
  } catch (err) {
    req.log.error({ err }, "Error updating order status");
    res.status(400).json({ message: "Error al actualizar la orden" });
  }
});

export default router;
