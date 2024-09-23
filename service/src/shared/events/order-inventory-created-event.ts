import { OrderInventoryEventSubjects } from "./order-inventory-event-subjects";

export interface OrderInventoryCreatedEvent {
  subject: OrderInventoryEventSubjects.OrderInventoryCreated;
  data: {
    id: string;
    supplierId: string;
    merchantId: string;
    userId: string;
    cartId: string;
    orderId?: string;
    status: string;
    cartConfirmData: Date;
    products: {
      id: string;
      quantity: number;
    }[];
  };
}
