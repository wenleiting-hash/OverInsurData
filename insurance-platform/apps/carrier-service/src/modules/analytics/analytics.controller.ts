import {
  Controller, Get, Query, UseGuards, Logger,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Query() q: any) {
    return this.service.getOverview({ period: q.period });
  }

  @Get('products')
  async getProducts(@Query() q: any) {
    return this.service.getProducts({ period: q.period });
  }

  @Get('regional')
  async getRegional(@Query() q: any) {
    return this.service.getRegional({ period: q.period });
  }

  @Get('channels')
  async getChannels(@Query() q: any) {
    return this.service.getChannels({ period: q.period });
  }

  @Get('loss-ratio')
  async getLossRatio(@Query() q: any) {
    return this.service.getLossRatio({ period: q.period });
  }

  @Get('renewal')
  async getRenewal(@Query() q: any) {
    return this.service.getRenewal({ period: q.period });
  }

  @Get('export')
  async exportReport(@Query() q: any) {
    return this.service.exportReport({ format: q.format, sections: q.sections });
  }
}
