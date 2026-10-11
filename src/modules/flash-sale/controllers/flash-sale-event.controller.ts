import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { FlashSaleService } from "../services/flash-sale.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../user/enums/role.enum";
import { CreateFlashSaleEventDto } from "../dto/create-flash-sale-event.dto";
import { FlashSaleEventResponseDto } from "../dto/flash-sale-event-response.dto";

@Controller('api/v1/flash-sale/events')
export class FlashSaleEventController {
    constructor(private readonly flashSaleService: FlashSaleService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async createEvent(
        @Body() dto: CreateFlashSaleEventDto,
    ): Promise<FlashSaleEventResponseDto> {
        return this.flashSaleService.createEvent(dto);
    }
}