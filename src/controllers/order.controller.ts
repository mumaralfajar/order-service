import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateOrderCommand } from '../cqrs/commands/create-order.command';
import { GetOrderQuery } from '../cqrs/queries/get-order.query';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createOrder(@Body() createOrderDto: { productId: string; quantity: number }) {
    return this.commandBus.execute(
      new CreateOrderCommand(createOrderDto.productId, createOrderDto.quantity)
    );
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.queryBus.execute(new GetOrderQuery(id));
  }
}
