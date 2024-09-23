import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import { CartConfirmedEvent, CartEventSubjects, Cart } from "@ebazdev/order";
import { queueGroupName } from "./queu-group-name";
import { Inventory } from "../../shared/models/inventory";
import { OrderInventory } from "../../shared/models/order-inventory";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { OrderInventoryCreatedPublisher } from "../publisher/order-inventory-created-publisher";
import { natsWrapper } from "../../nats-wrapper";
import mongoose from "mongoose";

export class CartCreatedListener extends Listener<CartConfirmedEvent> {
  readonly subject = CartEventSubjects.CartConfirmed;
  queueGroupName = queueGroupName;

  async onMessage(data: CartConfirmedEvent["data"], msg: Message) {
    const { id, status, supplierId, merchantId, userId, products, orderedAt } = data;

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
          throw new BadRequestError(
            `Inventory not found for product ID: ${product.id}`
          );
        }

        const availableStock = inventory.availableStock;

        if (product.quantity > availableStock) {
          throw new BadRequestError(
            `Insufficient stock for product ID: ${product.id}`
          );
        }

        inventory.availableStock = inventory.availableStock - product.quantity;
        inventory.reservedStock = inventory.reservedStock + product.quantity;

        await inventory.save({ session });
      }

      const orderInventory = new OrderInventory({
        supplierId: supplierId,
        merchantId: merchantId,
        userId: userId,
        cartId: id,
        cartStatus: status,
        cartDate: orderedAt,
        products,
      });

      await orderInventory.save({ session });

      await new OrderInventoryCreatedPublisher(natsWrapper.client).publish({
        id: orderInventory.id.toString(),
        supplierId: orderInventory.supplierId.toString(),
        merchantId: orderInventory.merchantId.toString(),
        userId: orderInventory.userId.toString(),
        cartId: orderInventory.cartId.toString(),
        cartStatus: orderInventory.cartStatus.toString(),
        cartDate: orderInventory.cartDate,
        products: orderInventory.products.map((product) => ({
          id: product.id.toString(),
          quantity: product.quantity,
        })),
      });
      
      await session.commitTransaction();

      msg.ack();
    } catch (error) {
      await session.abortTransaction();
      console.log(`Error processing cart ID: ${id}`);
      console.log("Transaction aborted due to error: ", error);
    } finally {
      await session.endSession();
    }
  }
}
