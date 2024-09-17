import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { Inventory } from "../shared/models/inventory";
import { StatusCodes } from "http-status-codes";
import { InventoryCreatedPublisher } from "../events/publisher/inventory-created-publisher";
import { natsWrapper } from "../nats-wrapper";
import mongoose from "mongoose";

const router = express.Router();

router.post(
  "/create",
  [
    body("productId")
      .isMongoId()
      .withMessage("Product ID must be a valid Mongo ID"),
    body("totalStock")
      .isInt({ min: 0 })
      .withMessage("Total stock must be a non-negative integer"),
    body("reservedStock")
      .isInt({ min: 0 })
      .withMessage("Reserved stock must be a non-negative integer"),
    body("availableStock")
      .isInt({ min: 0 })
      .withMessage("Available stock must be a non-negative integer"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { productId, totalStock, reservedStock, availableStock } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const inventory = new Inventory({
        productId,
        totalStock,
        reservedStock,
        availableStock,
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

      res.status(StatusCodes.CREATED).send(inventory);
    } catch (error: any) {
      await session.abortTransaction();
      console.error(error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      throw new BadRequestError("Error creating inventory");
    } finally {
      session.endSession();
    }
  }
);

export { router as createInventoryRouter };
