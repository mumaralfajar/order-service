import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { OrderCreatedEvent } from '../events/order-created.event';

@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async handle(event: OrderCreatedEvent) {
    console.log(`[Order Event] Publishing order created event to RabbitMQ`);
    
    await this.amqpConnection.publish('order_exchange', 'order.created', {
      orderId: event.orderId,
      productId: event.productId,
      quantity: event.quantity,
    });
  }
}
