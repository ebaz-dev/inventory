import { Publisher } from "@ebazdev/core";
import { InventoryUpdatedEvent } from "../../shared/events/inventory-update-event";
import { InventoryEventSubjects } from "../../shared/events/inventory-event-subjects";

export class InventoryUpdatedPublisher extends Publisher<InventoryUpdatedEvent> {
  subject: InventoryEventSubjects.InventoryUpdate =
    InventoryEventSubjects.InventoryUpdate;
}
