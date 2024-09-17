import { Publisher } from "@ebazdev/core";
import { InventoryCreatedEvent } from "../../shared/events/inventory-created-event";
import { InventoryEventSubjects } from "../../shared/events/inventory-event-subjects";

export class InventoryCreatedPublisher extends Publisher<InventoryCreatedEvent> {
  subject: InventoryEventSubjects.InventoryCreated =
    InventoryEventSubjects.InventoryCreated;
}