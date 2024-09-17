import express, { Request, Response } from "express";
import { param } from "express-validator";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { Inventory } from "../shared/models/inventory";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get(
  "/:productId",
  [param("productId").isMongoId().withMessage("Invalid product id")],
  validateRequest,
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    const inventory = await Inventory.findOne({ productId: productId });
    if (!inventory) {
      throw new BadRequestError("Inventory not found");
    }

    res.status(StatusCodes.OK).send(inventory);
  }
);

export { router as getRouter };
