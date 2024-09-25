import { Document, Schema, model, Types } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum InventoryCheckSatus {
  cancelled = "cancelled",
  confirmed = "confirmed",
}

interface InventoryDoc extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  version: number;
}

const inventorySchema = new Schema<InventoryDoc>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    totalStock: {
      type: Number,
      required: true,
    },
    reservedStock: {
      type: Number,
      required: true,
    },
    availableStock: {
      type: Number,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    timestamps: true,
  }
);

inventorySchema.set("versionKey", "version");
inventorySchema.plugin(updateIfCurrentPlugin);

const Inventory = model<InventoryDoc>("Inventory", inventorySchema);

export { Inventory, InventoryDoc };
