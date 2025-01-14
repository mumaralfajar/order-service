import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { InventoryGrpcClient } from '../grpc/inventory.grpc.client';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    private readonly amqpConnection: AmqpConnection,
    private readonly inventoryGrpcClient: InventoryGrpcClient,
  ) {}

  async createOrder(productId: string, quantity: number): Promise<string> {
    try {
      console.log(`Checking stock for product ${productId}`);
      const stock = await this.inventoryGrpcClient.checkStock(productId);
      
      if (stock === undefined) {
        throw new Error('Failed to get stock information');
      }
      
      console.log(`Current stock: ${stock}`);
      if (stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${stock}, Requested: ${quantity}`);
      }

      const order = this.orderRepository.create({ productId, quantity });
      const savedOrder = await this.orderRepository.save(order);
      console.log(`Order created with ID: ${savedOrder.id}`);

      await this.amqpConnection.publish('order_exchange', 'order.created', {
        orderId: savedOrder.id,
        productId: savedOrder.productId,
        quantity: savedOrder.quantity,
      });
      console.log('Published order.created event');

      return savedOrder.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
}
