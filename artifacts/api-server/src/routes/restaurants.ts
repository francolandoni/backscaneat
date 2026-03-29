import { Router, type IRouter } from "express";
import { db, eq } from "@workspace/db";
import { restaurantTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/ping", (_req, res) => {
  res.json("pong");
});

router.get("/restaurants", async (req, res) => {
  try {
    const restaurants = await db.select().from(restaurantTable);
    if (restaurants.length === 0) {
      res.status(204).send();
      return;
    }
    res.json(restaurants.map((r) => ({ restaurant_id: r.id, name: r.name })));
  } catch (err) {
    req.log.error({ err }, "Error fetching restaurants");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/restaurant/:restaurantId", async (req, res) => {
  const restaurantId = Number(req.params.restaurantId);
  try {
    const [restaurant] = await db
      .select()
      .from(restaurantTable)
      .where(eq(restaurantTable.id, restaurantId));

    if (!restaurant) {
      res.status(204).send();
      return;
    }
    res.json({ restaurant_id: restaurant.id, name: restaurant.name });
  } catch (err) {
    req.log.error({ err }, "Error fetching restaurant");
    res.status(400).json({ message: "Bad request" });
  }
});

export default router;
