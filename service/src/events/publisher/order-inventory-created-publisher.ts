import { Publisher } from "@ebazdev/core";
import { OrderInventoryCreatedEvent } from "../../shared/events/order-inventory-created-event";
import { OrderInventoryEventSubjects } from "../../shared/events/order-inventory-event-subjects";

export class OrderInventoryCreatedPublisher extends Publisher<OrderInventoryCreatedEvent> {
  subject: OrderInventoryEventSubjects.OrderInventoryCreated =
    OrderInventoryEventSubjects.OrderInventoryCreated;
}
