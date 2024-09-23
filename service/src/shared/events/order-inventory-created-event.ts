import { OrderInventoryEventSubjects } from "./order-inventory-event-subjects";

export interface OrderInventoryCreatedEvent {
  subject: OrderInventoryEventSubjects.OrderInventoryCreated;
  data: {
    id: string;
    supplierId: string;
    merchantId: string;
    userId: string;
    cartId: string;
    cartStatus: string;
    orderId?: string;
    orderStatus?: string;
    cartDate: Date;
    products: {
      id: string;
      quantity: number;
    }[];
  };
}
