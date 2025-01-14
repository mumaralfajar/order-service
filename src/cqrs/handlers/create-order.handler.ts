import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { CreateOrderCommand } from '../commands/create-order.command';
import { OrderCreatedEvent } from '../events/order-created.event';
import { InventoryGrpcClient } from '../../grpc/inventory.grpc.client';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private inventoryGrpcClient: InventoryGrpcClient,
    private eventBus: EventBus,
  ) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const { productId, quantity } = command;

    // Check stock via gRPC
    console.log(`[Order Command] Checking stock for product ${productId}`);
    const stock = await this.inventoryGrpcClient.checkStock(productId);

    if (stock === undefined) {
      throw new Error('Failed to get stock information');
    }

    if (stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${stock}, Requested: ${quantity}`);
    }

    // Create and save order
    const order = this.orderRepository.create({
      productId,
      quantity,
      status: 'Pending',
    });

    const savedOrder = await this.orderRepository.save(order);

    // Publish domain event
    this.eventBus.publish(
      new OrderCreatedEvent(savedOrder.id, productId, quantity)
    );

    return savedOrder.id;
  }
}
