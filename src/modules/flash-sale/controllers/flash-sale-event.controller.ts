import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { FlashSaleService } from "../services/flash-sale.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../user/enums/role.enum";
import { CreateFlashSaleEventDto } from "../dto/create-flash-sale-event.dto";
import { FlashSaleEventResponseDto } from "../dto/flash-sale-event-response.dto";
import { ActiveFlashSaleResponseDto } from "../dto/active-flash-sale-response.dto";
import { PurchaseFlashSaleResponseDto } from "../dto/purchase-flash-sale-response.dto";
import { PurchaseFlashSaleDto } from "../dto/purchase-flash-sale.dto";

@Controller('api/v1/flash-sale')
export class FlashSaleEventController {
    constructor(private readonly flashSaleService: FlashSaleService) { }

    @Post('/events')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async createEvent(
        @Body() dto: CreateFlashSaleEventDto,
    ): Promise<FlashSaleEventResponseDto> {
        return this.flashSaleService.createEvent(dto);
    }

    @Get('/active')
    @HttpCode(HttpStatus.OK)
    async getActiveFlashSale(): Promise<ActiveFlashSaleResponseDto> {
        return this.flashSaleService.getActiveFlashSale();
    }

    @Post('/purchase')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.CUSTOMER)
    @HttpCode(HttpStatus.ACCEPTED)
    async purchase(
        @Req() req: any,
        @Body() dto: PurchaseFlashSaleDto,
    ): Promise<PurchaseFlashSaleResponseDto> {
        const userId = req.user.id;
        return this.flashSaleService.purchase(userId, dto);
    }
}