import { OrderInventoryEventSubjects } from "./order-inventory-event-subjects";
import { InventoryCheckSatus } from "../models/inventory";

type CartStatus = InventoryCheckSatus;

export interface CartInventoryCheckedEvent {
  subject: OrderInventoryEventSubjects.CartInventoryChecked;
  data: {
    cartId: string;
    status: CartStatus;
  };
}
