import { Document, Schema, model, Types } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export interface Item {
  productId: Types.ObjectId;
  quantity: number;
}

interface OrderInventoryDoc extends Document {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  cartId: Types.ObjectId;
  orderId?: Types.ObjectId;
  items: Item[];
}

const itemSchema = new Schema<Item>({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderInventorySchema = new Schema<OrderInventoryDoc>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    cartId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Cart",
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    items: {
      type: [itemSchema],
      validate: {
        validator: (value: Item[]) => value.length > 0,
        message: "At least one item must be included in the order.",
      },
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
  }
);

orderInventorySchema.plugin(updateIfCurrentPlugin);

const OrderInventory = model<OrderInventoryDoc>(
  "OrderInventory",
  orderInventorySchema
);

export { OrderInventory };
