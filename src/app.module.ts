import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Order } from './entities/order.entity';
import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';
import { InventoryGrpcClient } from './grpc/inventory.grpc.client';

@Module({
  imports: [
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
  providers: [OrderService, InventoryGrpcClient],
})
export class AppModule {}
