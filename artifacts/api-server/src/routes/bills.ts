import { Router, type IRouter } from "express";
import { db, eq, and } from "@workspace/db";
import { ordersTable, restaurantTable } from "@workspace/db/schema";
import { sseNotifyBill } from "../lib/sse";

const router: IRouter = Router();

router.post("/bill/:restaurantId/:tableId", async (req, res) => {
  const restaurantId = Number(req.params.restaurantId);
  const tableId = Number(req.params.tableId);

  try {
    const [restaurant] = await db
      .select()
      .from(restaurantTable)
      .where(eq(restaurantTable.id, restaurantId));

    if (!restaurant) {
      res.status(400).json({ message: "Restaurante no encontrado" });
      return;
    }

    const activeOrders = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.restaurantId, restaurantId),
          eq(ordersTable.tableNumber, tableId)
        )
      );

    if (activeOrders.length === 0) {
      res.status(400).json({ message: "No hay órdenes activas para esta mesa" });
      return;
    }

    const bill = {
      restaurant_id: restaurantId,
      table_number: tableId,
    };

    sseNotifyBill(bill);
    res.status(200).json(tableId);
  } catch (err) {
    req.log.error({ err }, "Error requesting bill");
    res.status(500).send();
  }
});

export default router;
