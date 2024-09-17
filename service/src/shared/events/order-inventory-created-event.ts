import { OrderInventoryEventSubjects } from "./order-inventory-event-subjects";

export interface OrderInventoryCreatedEvent {
  subject: OrderInventoryEventSubjects.OrderInventoryCreated;
  data: {
    id: string;
    customerId: string;
    cartId: string;
    orderId?: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  };
}
