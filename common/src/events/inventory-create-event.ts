import { InventoryEventSubjects } from "./inventory-event-subjects";

export interface InventoryCreateEvent {
  subject: InventoryEventSubjects.InventoryCreate;
  data: {
    id: string;
    productId: string;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
  };
}
