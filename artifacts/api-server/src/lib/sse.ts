import type { Response } from "express";

const orderClients = new Set<Response>();
const billClients = new Set<Response>();

export function addOrderClient(res: Response) {
  orderClients.add(res);
  res.on("close", () => orderClients.delete(res));
}

export function addBillClient(res: Response) {
  billClients.add(res);
  res.on("close", () => billClients.delete(res));
}

function sendToClients(clients: Set<Response>, data: unknown) {
  const json = JSON.stringify(data);
  const dead: Response[] = [];
  for (const client of clients) {
    try {
      client.write(`data: ${json}\n\n`);
    } catch {
      dead.push(client);
    }
  }
  dead.forEach((c) => clients.delete(c));
}

export function sseNotifyOrder(order: unknown) {
  sendToClients(orderClients, order);
}

export function sseNotifyBill(bill: unknown) {
  sendToClients(billClients, bill);
}
