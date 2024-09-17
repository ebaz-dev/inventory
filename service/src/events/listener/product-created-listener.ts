import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import { ProductCreatedEvent, ProductEventSubjects } from "@ebazdev/product";
import { Inventory } from "../../shared/models/inventory";
import { queueGroupName } from "./queu-group-name";
import { InventoryCreatedPublisher } from "../publisher/inventory-created-publisher";
import { natsWrapper } from "../../nats-wrapper";
import mongoose from "mongoose";

export class ProductCreatedListener extends Listener<ProductCreatedEvent> {
  readonly subject = ProductEventSubjects.ProductCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: ProductCreatedEvent["data"], msg: Message) {
    const { id } = data;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const inventory = new Inventory({
        productId: id,
        totalStock: 0,
        reservedStock: 0,
        availableStock: 0,
      });

      await inventory.save({ session });

      await new InventoryCreatedPublisher(natsWrapper.client).publish({
        id: inventory.id,
        productId: inventory.productId.toString(),
        totalStock: inventory.totalStock as number,
        reservedStock: inventory.reservedStock as number,
        availableStock: inventory.availableStock as number,
      });

      await session.commitTransaction();

      msg.ack();
    } catch (error) {
      await session.abortTransaction();
      console.log(`Error processing product ID: ${id}`);
      console.log("Transaction aborted due to error: ", error);
    } finally {
      await session.endSession();
    }
  }
}
