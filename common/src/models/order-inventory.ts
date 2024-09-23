import { Document, Schema, model, Types } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export interface Product {
  id: Types.ObjectId;
  quantity: number;
}

interface OrderInventoryDoc extends Document {
  _id: Types.ObjectId;
  supplierId: Types.ObjectId;
  merchantId: Types.ObjectId;
  userId: Types.ObjectId;
  cartId: Types.ObjectId;
  cartStatus: string;
  orderId?: Types.ObjectId;
  orderStatus?: string;
  cartDate: Date;
  orderData?: Date;
  products: Product[];
}

const itemSchema = new Schema<Product>({
  id: {
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
    supplierId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    cartId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Cart",
    },
    cartStatus: {
      type: String,
      required: true,
    },
    cartDate: {
      type: Date,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    orderStatus: {
      type: String
    },
    orderData: {
      type: Date
    },
    products: {
      type: [itemSchema],
      validate: {
        validator: (value: Product[]) => value.length > 0,
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
    timestamps: true,
  }
);

orderInventorySchema.set("versionKey", "version");
orderInventorySchema.plugin(updateIfCurrentPlugin);

const OrderInventory = model<OrderInventoryDoc>(
  "OrderInventory",
  orderInventorySchema
);

export { OrderInventory };
