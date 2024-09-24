import { Publisher } from "@ebazdev/core";
import { CartInventoryCheckedEvent } from "../../shared/events/cart-inventory-checked-event";
import { OrderInventoryEventSubjects } from "../../shared/events/order-inventory-event-subjects";

export class CartInventoryChecked extends Publisher<CartInventoryCheckedEvent> {
  subject: OrderInventoryEventSubjects.CartInventoryChecked =
    OrderInventoryEventSubjects.CartInventoryChecked;
}
