import { Router, type IRouter } from "express";
import { addOrderClient, addBillClient } from "../lib/sse";

const router: IRouter = Router();

router.get("/orders-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  addOrderClient(res);
});

router.get("/bills-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  addBillClient(res);
});

export default router;
