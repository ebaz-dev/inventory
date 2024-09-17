import { Publisher } from "@ebazdev/core";
import { InventoryCreateEvent } from "../../shared/events/inventory-create-event";
import { InventoryEventSubjects } from "../../shared/events/inventory-event-subjects";

export class InventoryCreatedPublisher extends Publisher<InventoryCreateEvent> {
  subject: InventoryEventSubjects.InventoryCreate =
    InventoryEventSubjects.InventoryCreate;
}
