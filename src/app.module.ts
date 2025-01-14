import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Order } from './entities/order.entity';
import { OrderController } from './controllers/order.controller';
import { InventoryGrpcClient } from './grpc/inventory.grpc.client';

// CQRS Handlers
import { CreateOrderHandler } from './cqrs/handlers/create-order.handler';
import { OrderCreatedHandler } from './cqrs/handlers/order-created.handler';
import { GetOrderHandler } from './cqrs/handlers/get-order.handler';

const CommandHandlers = [CreateOrderHandler];
const EventHandlers = [OrderCreatedHandler];
const QueryHandlers = [GetOrderHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'order_db',
      entities: [Order],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Order]),
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [{ name: 'order_exchange', type: 'topic' }],
      uri: 'amqp://guest:guest@localhost:5672',
    }),
  ],
  controllers: [OrderController],
  providers: [
    InventoryGrpcClient,
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
  ],
})
export class AppModule {}
