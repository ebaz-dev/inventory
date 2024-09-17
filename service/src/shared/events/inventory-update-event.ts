import { InventoryEventSubjects } from "./inventory-event-subjects";

export interface InventoryUpdatedEvent {
  subject: InventoryEventSubjects.InventoryUpdate;
  data: {
    id: string;
    productId: string;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
  };
}
