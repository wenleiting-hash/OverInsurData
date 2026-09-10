import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDetailService } from './product-detail.service';
import { ProductController } from './product.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductDetailService, JwtAuthGuard],
  exports: [ProductService],
})
export class ProductModule {}
