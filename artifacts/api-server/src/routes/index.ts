import { Router, type IRouter } from "express";
import healthRouter from "./health";
import restaurantsRouter from "./restaurants";
import menuItemsRouter from "./menuItems";
import ordersRouter from "./orders";
import billsRouter from "./bills";
import sseRouter from "./sse";

const router: IRouter = Router();

router.use(healthRouter);
router.use(restaurantsRouter);
router.use(menuItemsRouter);
router.use(ordersRouter);
router.use(billsRouter);
router.use(sseRouter);

export default router;
