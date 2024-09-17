import { InventoryEventSubjects } from "./inventory-event-subjects";

export interface InventoryUpdatedEvent {
  subject: InventoryEventSubjects.InventoryUpdated;
  data: {
    id: string;
    productId: string;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
  };
}
