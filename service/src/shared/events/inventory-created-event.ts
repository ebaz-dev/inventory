import { InventoryEventSubjects } from "./inventory-event-subjects";

export interface InventoryCreatedEvent {
  subject: InventoryEventSubjects.InventoryCreated;
  data: {
    id: string;
    productId: string;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
  };
}
