import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable, restaurantsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sseNotifyBill } from "../lib/sse";

const router: IRouter = Router();

router.post("/bill/:restaurantId/:tableId", async (req, res) => {
  const restaurantId = BigInt(req.params.restaurantId);
  const tableId = BigInt(req.params.tableId);

  try {
    const [restaurant] = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, restaurantId));

    if (!restaurant) {
      res.status(400).json({ message: "Restaurante no encontrado" });
      return;
    }

    const pendingOrders = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.restaurantId, restaurantId),
          eq(ordersTable.tableNumber, tableId)
        )
      )
      .orderBy(desc(ordersTable.date));

    if (pendingOrders.length === 0) {
      res.status(400).json({ message: "No hay órdenes activas para esta mesa" });
      return;
    }

    const bill = {
      restaurant_id: Number(restaurantId),
      table_number: Number(tableId),
    };

    sseNotifyBill(bill);
    res.status(200).json(Number(tableId));
  } catch (err) {
    req.log.error({ err }, "Error requesting bill");
    res.status(500).send();
  }
});

export default router;
