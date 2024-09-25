import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  OrderDeliveredEvent,
  OrderEventSubjects,
  OrderStatus,
} from "@ebazdev/order";
import { queueGroupName } from "./queu-group-name";
import { Inventory } from "../../shared/models/inventory";
import { OrderInventory } from "../../shared/models/order-inventory";
import mongoose from "mongoose";

export class OrderDeliveredListener extends Listener<OrderDeliveredEvent> {
  readonly subject = OrderEventSubjects.OrderDelivered;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderDeliveredEvent["data"], msg: Message) {
    const { id, status } = data;

    if (status != OrderStatus.Delivered) {
      throw new Error("Invalid order status");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderInventory = await OrderInventory.findOne({
        orderId: id,
      }).session(session);

      if (!orderInventory) {
        throw new Error(`Order inventory not found for ID: ${id}`);
      }

      const orderProducts = orderInventory.products;

      for (const item of orderProducts) {
        const inventory = await Inventory.findOne({
          productId: item.id,
        }).session(session);

        if (!inventory) {
          throw new Error(`Inventory not found for product ID: ${item.id}`);
        }

        inventory.reservedStock -= item.quantity;
        inventory.totalStock -= item.quantity;

        await inventory.save({ session });
      }

      orderInventory.orderStatus = status;
      await orderInventory.save({ session });

      await session.commitTransaction();
      msg.ack();
    } catch (error) {
      console.error(`Error processing order ID: ${id}`, error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      await session.endSession();
    }
  }
}
