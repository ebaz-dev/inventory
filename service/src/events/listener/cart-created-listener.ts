import { Message } from "node-nats-streaming";
import { Listener, BadRequestError } from "@ebazdev/core";
import { CartConfirmedEvent, CartEventSubjects, Cart } from "@ebazdev/order";
import { queueGroupName } from "./queu-group-name";
import { Inventory } from "../../shared/models/inventory";
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

    const cart = await Cart.findById(id);
    if (!cart) {
      throw new BadRequestError(`Cart not found for ID: ${id}`);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const product of products) {
        const inventory = await Inventory.findOne({
          productId: product.id,
        }).session(session);

        if (!inventory) {
          await new CartInventoryChecked(natsWrapper.client).publish({
            cartId: id.toString(),
            status: "cancelled",
          });
          throw new BadRequestError(
            `Inventory not found for product ID: ${product.id}`
          );
        }

        const availableStock = inventory.availableStock;

        if (product.quantity > availableStock) {
          await new CartInventoryChecked(natsWrapper.client).publish({
            cartId: id.toString(),
            status: "cancelled",
          });

          throw new BadRequestError(
            `Insufficient stock for product ID: ${product.id}`
          );
        }

        inventory.availableStock -= product.quantity;
        inventory.reservedStock += product.quantity;

        await inventory.save({ session });
      }

      const orderInventory = new OrderInventory({
        cartId: id,
        products,
      });

      await orderInventory.save({ session });

      await new CartInventoryChecked(natsWrapper.client).publish({
        cartId: orderInventory.cartId.toString(),
        status: "confirmed",
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
      console.error(`Error processing cart ID: ${id}`);
      console.error("Transaction aborted due to error: ", error);

      // Publish the cancelled event and acknowledge the message
      await new CartInventoryChecked(natsWrapper.client).publish({
        cartId: id.toString(),
        status: "cancelled",
      });

      msg.ack();
    } finally {
      await session.endSession();
    }
  }
}