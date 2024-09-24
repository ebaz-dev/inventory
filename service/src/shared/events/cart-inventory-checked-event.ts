import { OrderInventoryEventSubjects } from "./order-inventory-event-subjects";

type CartStatus = 'cancelled' | 'confirmed';

export interface CartInventoryCheckedEvent {
  subject: OrderInventoryEventSubjects.CartInventoryChecked;
  data: {
    cartId: string;
    status: CartStatus;
  };
}
