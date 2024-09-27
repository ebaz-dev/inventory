import { Message } from "node-nats-streaming";
import { Listener, BadRequestError } from "@ebazdev/core";
import { CartConfirmedEvent, CartEventSubjects } from "@ebazdev/order";
import { queueGroupName } from "./queu-group-name";
import { Inventory, InventoryCheckSatus } from "../../shared/models/inventory";
import { OrderInventory } from "../../shared/models/order-inventory";
import { OrderInventoryCreatedPublisher } from "../publisher/order-inventory-created-publisher";
import { CartInventoryChecked } from "../publisher/cart-inventory-checked-publisher";
import { natsWrapper } from "../../nats-wrapper";
import mongoose from "mongoose";

export class CartCreatedListener extends Listener<CartConfirmedEvent> {
  readonly subject = CartEventSubjects.CartConfirmed;
  queueGroupName = queueGroupName;

  async onMessage(data: CartConfirmedEvent["data"], msg: Message) {
    const { id, products } = data;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let insufficientProducts: string[] = [];

      for (const product of products) {
        const inventory = await Inventory.findOne({
          productId: product.id,
        }).session(session);

        if (!inventory) {
          insufficientProducts.push(product.id.toString());
          continue;
        }

        const availableStock = inventory.availableStock;

        if (product.quantity > availableStock) {
          insufficientProducts.push(product.id.toString());
          continue;
        }

        inventory.availableStock -= product.quantity;
        inventory.reservedStock += product.quantity;

        await inventory.save({ session });
      }

      if (insufficientProducts.length > 0) {
        throw new InsufficientProductsError(
          "Insufficient products found",
          insufficientProducts
        );
      }

      const orderInventory = new OrderInventory({
        cartId: id,
        products: products,
      });

      await orderInventory.save({ session });

      await new CartInventoryChecked(natsWrapper.client).publish({
        cartId: orderInventory.cartId.toString(),
        status: InventoryCheckSatus.confirmed,
      });

      await new OrderInventoryCreatedPublisher(natsWrapper.client).publish({
        id: orderInventory.id.toString(),
        cartId: orderInventory.cartId.toString(),
        products: orderInventory.products.map((product) => ({
          id: product.id.toString(),
          quantity: product.quantity,
        })),
      });

      await session.commitTransaction();

      msg.ack();
    } catch (error) {
      await session.abortTransaction();

      if (error instanceof InsufficientProductsError) {
        console.error("Insufficient product IDs:", error.productIds);
        await new CartInventoryChecked(natsWrapper.client).publish({
          cartId: id.toString(),
          status: InventoryCheckSatus.cancelled,
          insufficientProducts: error.productIds,
        });

        msg.ack();
      } else {
        console.error(`Error processing cart ID: ${id}`);
        console.error("Transaction aborted due to error: ", error);
      }
    } finally {
      await session.endSession();
    }
  }
}

class InsufficientProductsError extends Error {
  productIds: string[];

  constructor(message: string, productIds: string[]) {
    super(message);
    this.productIds = productIds;
    this.name = "InsufficientProductsError";
  }
}
