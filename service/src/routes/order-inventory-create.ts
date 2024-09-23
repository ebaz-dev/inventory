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
  supplierId: string;
  merchantId: string;
  userId: string;
  cartConfirmData: Date;
  status: string;
}

router.post(
  "/order/create",
  [
    body("cartId").isMongoId().withMessage("Cart ID must be a valid Mongo ID"),
    body("supplierId")
      .isMongoId()
      .withMessage("Supplier ID must be a valid Mongo ID"),
    body("merchantId")
      .isMongoId()
      .withMessage("Merchant ID must be a valid Mongo ID"),
    body("userId")
      .isMongoId()
      .withMessage("User ID must be a valid Mongo ID"),
    body("cartConfirmData")
      .isISO8601()
      .toDate()
      .withMessage("Cart Confirm Data must be a valid date"),
    body("status")
      .isString()
      .withMessage("Status must be a valid string"),
    body("products")
      .isArray({ min: 1 })
      .withMessage("Products must be an array with at least one item"),
    body("products.*.id")
      .isMongoId()
      .withMessage("Product ID must be a valid Mongo ID"),
    body("products.*.quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {

    const {
      cartId,
      products,
      orderId,
      supplierId,
      merchantId,
      userId,
      cartDate,
      status,
    } = req.body;

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
        userId,
        cartId,
        products,
        status,
        cartDate,
        ...(orderId && { orderId }),
      });

      await orderInventory.save({ session });

      await new OrderInventoryCreatedPublisher(natsWrapper.client).publish({
        id: orderInventory.id,
        supplierId: orderInventory.supplierId.toString(),
        merchantId: orderInventory.merchantId.toString(),
        userId: orderInventory.userId.toString(),
        cartId: orderInventory.cartId.toString(),
        cartStatus: orderInventory.cartStatus,
        cartDate: orderInventory.cartDate,
        orderId: orderInventory.orderId?.toString(),
        products: orderInventory.products.map((product) => ({
          id: product.id.toString(),
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
