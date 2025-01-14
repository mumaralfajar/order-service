import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Observable, lastValueFrom } from 'rxjs';

interface CheckStockRequest {
  productId: string;
}

interface CheckStockResponse {
  stock: number;
}

interface InventoryService {
  checkStock(request: CheckStockRequest): Observable<CheckStockResponse>;
}

@Injectable()
export class InventoryGrpcClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      url: 'localhost:50051',
      package: 'inventory',
      protoPath: join(__dirname, '../../protos/inventory.proto'),
    },
  })
  private client: ClientGrpc;

  private inventoryService: InventoryService;

  onModuleInit() {
    this.inventoryService = this.client.getService<InventoryService>('InventoryService');
  }

  async checkStock(productId: string): Promise<number> {
    try {
      console.log('Calling gRPC CheckStock with productId:', productId);
      const response = await lastValueFrom(
        this.inventoryService.checkStock({ productId })
      );
      console.log('gRPC response:', response);
      return response.stock;
    } catch (error) {
      console.error('gRPC call failed:', error);
      throw error;
    }
  }
}
