import { OrderInventoryEventSubjects } from "./order-inventory-event-subjects";
import { InventoryCheckSatus } from "../models/inventory";

type Status = InventoryCheckSatus;

export interface CartInventoryCheckedEvent {
  subject: OrderInventoryEventSubjects.CartInventoryChecked;
  data: {
    cartId: string;
    status: Status;
    insufficientProducts?: string[];
  };
}
