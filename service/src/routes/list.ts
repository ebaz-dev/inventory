import express, { Request, Response } from "express";
import { query } from "express-validator";
import { validateRequest, BadRequestError, NotFoundError } from "@ebazdev/core";
import { Inventory } from "../shared/models/inventory";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/list",
  [
    query("productIds")
      .optional()
      .custom((value) => {
        const idsArray = value.split(",").map((id: string) => id.trim());
        return idsArray.every((id: string) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      })
      .withMessage("IDs must be a comma-separated list of valid ObjectIds"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Limit must be a positive integer"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { productIds, page = "1", limit = "10" } = req.query;
    try {
      const idsArray = productIds
        ? (productIds as string).split(",").map((id: string) => id.trim())
        : [];
      const pageNumber = Math.max(1, parseInt(page as string, 10));
      const limitNumber = Math.max(1, parseInt(limit as string, 10));
      const skip = (pageNumber - 1) * limitNumber;

      const query = productIds ? { productId: { $in: idsArray } } : {};

      const total = await Inventory.countDocuments(query);

      const inventories = await Inventory.find(query)
        .skip(skip)
        .limit(limitNumber);

      if (!inventories || inventories.length === 0) {
        throw new NotFoundError();
      }

      res.status(StatusCodes.OK).send({
        products: inventories,
        total,
        totalPages: Math.ceil(total / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error fetching inventories:", error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError("Error fetching inventories");
    }
  }
);

export { router as listRouter };
