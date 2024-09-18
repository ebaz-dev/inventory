import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { OrderInventory, Product } from "../shared/models/order-inventory";
import { Inventory } from "../shared/models/inventory";
import { StatusCodes } from "http-status-codes";
import { OrderInventoryCreatedPublisher } from "../events/publisher/order-inventory-created-publisher";
import { natsWrapper } from "../nats-wrapper";
import mongoose from "mongoose";

const router = express.Router();

interface OrderRequestBody {
  cartId: string;
  customerId: string;
  products: Product[];
  orderId?: string;
}

router.post(
  "/order/create",
  [
    body("cartId").isMongoId().withMessage("Cart ID must be a valid Mongo ID"),
    body("customerId")
      .isMongoId()
      .withMessage("Customer ID must be a valid Mongo ID"),
    body("items")
      .isArray({ min: 1 })
      .withMessage("Items must be an array with at least one item"),
    body("items.*.productId")
      .isMongoId()
      .withMessage("Product ID must be a valid Mongo ID"),
    body("items.*.quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { cartId, products, orderId, customerId } =
      req.body as OrderRequestBody;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const product of products) {
        const inventory = await Inventory.findOne({
          productId: product.productId,
        }).session(session);

        if (!inventory) {
          throw new BadRequestError(
            `Inventory not found for product ID: ${product.productId}`
          );
        }

        const availableStock = inventory.availableStock;

        if (product.quantity > availableStock) {
          throw new BadRequestError(
            `Insufficient stock for product ID: ${product.productId}`
          );
        }

        inventory.availableStock = inventory.availableStock - product.quantity;
        inventory.reservedStock = inventory.reservedStock + product.quantity;

        await inventory.save({ session });
      }

      const orderInventory = new OrderInventory({
        customerId,
        cartId,
        products,
        ...(orderId && { orderId }),
      });

      await orderInventory.save({ session });

      await new OrderInventoryCreatedPublisher(natsWrapper.client).publish({
        id: orderInventory.id,
        customerId: orderInventory.customerId.toString(),
        cartId: orderInventory.cartId.toString(),
        orderId: orderInventory.orderId?.toString(),
        products: orderInventory.products.map((product) => ({
          productId: product.productId.toString(),
          quantity: product.quantity,
        })),
      });

      await session.commitTransaction();

      res.status(StatusCodes.CREATED).send(orderInventory);
    } catch (error: any) {
      await session.abortTransaction();

      console.error("Error during order inventory creation:", error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      throw new BadRequestError("Error creating order inventory");
    } finally {
      session.endSession();
    }
  }
);

export { router as createOrderInventoryRouter };
