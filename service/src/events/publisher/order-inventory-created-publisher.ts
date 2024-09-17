import { Publisher } from "@ebazdev/core";
import { OrderInventoryCreateEvent } from "../../shared/events/order-inventory-create-event";
import { OrderInventoryEventSubjects } from "../../shared/events/order-inventory-event-subjects";

export class OrderInventoryCreatedPublisher extends Publisher<OrderInventoryCreateEvent> {
  subject: OrderInventoryEventSubjects.OrderInventoryCreated =
    OrderInventoryEventSubjects.OrderInventoryCreated;
}
