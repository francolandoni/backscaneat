import { Router, type IRouter } from "express";
import { db, eq } from "@workspace/db";
import { menuItemsTable, restaurantTable } from "@workspace/db/schema";

const router: IRouter = Router();

function formatMenuItem(
  item: typeof menuItemsTable.$inferSelect,
  restaurant?: typeof restaurantTable.$inferSelect,
) {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    description: item.description ?? null,
    available: item.available,
    subgroup: item.subgroup ?? null,
    image_url: item.imageUrl ?? null,
    restaurant: restaurant
      ? { restaurant_id: restaurant.id, name: restaurant.name }
      : undefined,
  };
}

router.get("/menu-items/restaurant/:restaurantId", async (req, res) => {
  const restaurantId = Number(req.params.restaurantId);
  try {
    const rows = await db
      .select()
      .from(menuItemsTable)
      .leftJoin(restaurantTable, eq(menuItemsTable.restaurantId, restaurantTable.id))
      .where(eq(menuItemsTable.restaurantId, restaurantId));

    if (rows.length === 0) {
      res.status(400).json({
        message: `No existen items para el restaurante con el id ${restaurantId}`,
      });
      return;
    }
    res.json(rows.map((r) => formatMenuItem(r.menu_items, r.restaurant ?? undefined)));
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
    image_url?: string;
  };

  try {
    if (!body.name || body.price == null || !body.restaurant_id) {
      res.status(400).json({ message: "Faltan campos requeridos" });
      return;
    }

    await db.insert(menuItemsTable).values({
      name: body.name,
      price: body.price,
      description: body.description ?? null,
      restaurantId: body.restaurant_id,
      available: body.available ?? true,
      subgroup: body.subgroup ?? null,
      imageUrl: body.image_url ?? null,
    });

    res.status(201).json({ message: `El producto ${body.name} fue creado con éxito` });
  } catch (err) {
    req.log.error({ err }, "Error creating menu item");
    res.status(400).json({ message: "Error al crear el producto" });
  }
});

router.put("/menu-items/update/:menuItemId", async (req, res) => {
  const menuItemId = Number(req.params.menuItemId);
  const body = req.body as {
    name?: string;
    price?: number;
    description?: string;
    restaurant_id?: number;
    available?: boolean;
    subgroup?: string;
    image_url?: string;
  };

  try {
    const updateData: Partial<typeof menuItemsTable.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.restaurant_id !== undefined) updateData.restaurantId = body.restaurant_id;
    if (body.available !== undefined) updateData.available = body.available;
    if (body.subgroup !== undefined) updateData.subgroup = body.subgroup;
    if (body.image_url !== undefined) updateData.imageUrl = body.image_url;

    await db
      .update(menuItemsTable)
      .set(updateData)
      .where(eq(menuItemsTable.id, menuItemId));

    const [updated] = await db
      .select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, menuItemId));

    if (!updated) {
      res.status(500).json({ message: "Ocurrió un error al actualizar el producto." });
      return;
    }
    res.json({ message: `El producto ${updated.name} fue actualizado con éxito` });
  } catch (err) {
    req.log.error({ err }, "Error updating menu item");
    res.status(400).json({ message: "Error al actualizar el producto" });
  }
});

export default router;
