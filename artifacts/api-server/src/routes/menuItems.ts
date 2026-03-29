import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { menuItemsTable, restaurantsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function formatMenuItem(item: typeof menuItemsTable.$inferSelect, restaurant?: typeof restaurantsTable.$inferSelect) {
  return {
    id: Number(item.id),
    name: item.name,
    price: parseFloat(item.price),
    description: item.description ?? null,
    available: item.available,
    subgroup: item.subgroup ?? null,
    restaurant: restaurant
      ? { restaurant_id: Number(restaurant.id), name: restaurant.name }
      : undefined,
  };
}

router.get("/menu-items/restaurant/:restaurantId", async (req, res) => {
  const restaurantId = BigInt(req.params.restaurantId);
  try {
    const rows = await db
      .select()
      .from(menuItemsTable)
      .leftJoin(restaurantsTable, eq(menuItemsTable.restaurantId, restaurantsTable.id))
      .where(eq(menuItemsTable.restaurantId, restaurantId));

    if (rows.length === 0) {
      res.status(400).json({
        message: `No existen items para el restaurante con el id ${restaurantId}`,
      });
      return;
    }
    res.json(rows.map((r) => formatMenuItem(r.menu_items, r.restaurants ?? undefined)));
  } catch (err) {
    req.log.error({ err }, "Error fetching menu items");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/menu-items/create", async (req, res) => {
  const body = req.body as {
    name: string;
    price: number;
    description?: string;
    restaurant_id: number;
    available: boolean;
    subgroup?: string;
  };

  try {
    if (!body.name || body.price == null || !body.restaurant_id) {
      res.status(400).json({ message: "Faltan campos requeridos" });
      return;
    }

    const [created] = await db
      .insert(menuItemsTable)
      .values({
        name: body.name,
        price: String(body.price),
        description: body.description ?? null,
        restaurantId: BigInt(body.restaurant_id),
        available: body.available ?? true,
        subgroup: body.subgroup ?? null,
      })
      .returning();

    if (!created) {
      res.status(500).json("Ocurrió un error al crear el producto.");
      return;
    }
    res.status(201).json({ message: `El producto ${created.name} fue creado con éxito` });
  } catch (err) {
    req.log.error({ err }, "Error creating menu item");
    res.status(400).json({ message: "Error al crear el producto" });
  }
});

router.put("/menu-items/update/:menuItemId", async (req, res) => {
  const menuItemId = BigInt(req.params.menuItemId);
  const body = req.body as {
    name?: string;
    price?: number;
    description?: string;
    restaurant_id?: number;
    available?: boolean;
    subgroup?: string;
  };

  try {
    const updateData: Partial<typeof menuItemsTable.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = String(body.price);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.restaurant_id !== undefined) updateData.restaurantId = BigInt(body.restaurant_id);
    if (body.available !== undefined) updateData.available = body.available;
    if (body.subgroup !== undefined) updateData.subgroup = body.subgroup;

    const [updated] = await db
      .update(menuItemsTable)
      .set(updateData)
      .where(eq(menuItemsTable.id, menuItemId))
      .returning();

    if (!updated) {
      res.status(500).json("Ocurrió un error al actualizar el producto.");
      return;
    }
    res.json({ message: `El producto ${updated.name} fue actualizado con éxito` });
  } catch (err) {
    req.log.error({ err }, "Error updating menu item");
    res.status(400).json({ message: "Error al actualizar el producto" });
  }
});

export default router;
