import express, { Request, Response } from "express";
import { param } from "express-validator";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { Inventory } from "../shared/models/inventory";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid inventory id"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      throw new BadRequestError("Inventory not found");
    }

    res.status(StatusCodes.OK).send(inventory);
  }
);

export { router as getRouter };
