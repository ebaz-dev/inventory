// import { Message } from "node-nats-streaming";
// import { Listener } from "@ebazdev/core";
// import { CartCreatedEvent, CartEventSubjects, Cart } from "@ebazdev/cart";
// import { queueGroupName } from "./queu-group-name";
// import { Inventory } from "../../shared/models/inventory";
// import { OrderInventory } from "../../shared/models/order-inventory";
// import { validateRequest, BadRequestError } from "@ebazdev/core";
// import { OrderInventoryCreatedPublisher } from "../publisher/order-inventory-created-publisher";
// import { natsWrapper } from "../../nats-wrapper";
// import mongoose from "mongoose";

// export class CartCreatedListener extends Listener<CartCreatedEvent> {
//   readonly subject = CartEventSubjects.CartCreated;
//   queueGroupName = queueGroupName;

//   async onMessage(data: CartCreatedEvent["data"], msg: Message) {
//     const { id, customerId, products } = data;

//     const cart = await Cart.findById(id);
//     if (!cart) {
//       throw new BadRequestError(`Cart not found for ID: ${id}`);
//     }

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//       for (const product of products) {
//         const inventory = await Inventory.findOne({
//           productId: product.productId,
//         }).session(session);

//         if (!inventory) {
//           throw new BadRequestError(
//             `Inventory not found for product ID: ${product.productId}`
//           );
//         }

//         const availableStock = inventory.availableStock;

//         if (product.quantity > availableStock) {
//           throw new BadRequestError(
//             `Insufficient stock for product ID: ${product.productId}`
//           );
//         }

//         inventory.availableStock = inventory.availableStock - product.quantity;
//         inventory.reservedStock = inventory.reservedStock + product.quantity;

//         await inventory.save({ session });
//       }

//       const orderInventory = new OrderInventory({
//         cartId: id,
//         customerId,
//         products,
//       });

//       await orderInventory.save({ session });

//       await new OrderInventoryCreatedPublisher(natsWrapper.client).publish({
//         id: orderInventory.id,
//         customerId: orderInventory.customerId.toString(),
//         cartId: orderInventory.cartId.toString(),
//         products: orderInventory.products.map((product) => ({
//           productId: product.productId.toString(),
//           quantity: product.quantity,
//         })),
//       });

//       await session.commitTransaction();

//       msg.ack();
//     } catch (error) {
//       await session.abortTransaction();
//       console.log(`Error processing cart ID: ${id}`);
//       console.log("Transaction aborted due to error: ", error);
//     } finally {
//       await session.endSession();
//     }
//   }
// }
