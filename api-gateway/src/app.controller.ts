import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Res,
  Req,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // ----- Progress endpoints -----
  @UseGuards(JwtAuthGuard)
  @Post('progress')
  async httpCreateProgress(@Body() body: any) {
    return await this.appService.createProgress(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('progress/:id')
  async httpGetProgress(@Param('id') id: string) {
    return await this.appService.getProgress({ id });
  }

  @UseGuards(JwtAuthGuard)
  @Get('progress')
  async httpQueryProgress(@Param() params, @Body() body, @Req() req) {
    // forward query params
    const { userId, courseId } = req.query;
    return await this.appService.getProgress({ userId, courseId });
  }

  @UseGuards(JwtAuthGuard)
  @Put('progress/:id')
  async httpUpdateProgress(@Param('id') id: string, @Body() body: any) {
    return await this.appService.updateProgress({ id, dto: body });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('progress/:id')
  async httpDeleteProgress(@Param('id') id: string) {
    return await this.appService.deleteProgress({ id });
  }

  // ----- Notification endpoints -----
  @UseGuards(JwtAuthGuard)
  @Post('notifications')
  async httpCreateNotification(@Body() body: any, @Req() req: Request) {
    const userId = req.user?.id;
    return await this.appService.createNotification({ ...body, userId });
  }

  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async httpGetNotifications(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.id;
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const pageNumber = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limitNumber = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

    return await this.appService.getAllNotifications({
      userId,
      page: pageNumber,
      limit: limitNumber,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('notifications/:id')
  async httpGetNotification(@Param('id') id: string) {
    return await this.appService.getNotification({ id });
  }

  @UseGuards(JwtAuthGuard)
  @Put('notifications/:id')
  async httpUpdateNotification(@Param('id') id: string, @Body() body: any) {
    return await this.appService.updateNotification({ id, updateData: body });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notifications/:id/read')
  async httpUpdateReadStatus(
    @Param('id') id: string,
    @Body('read') read: boolean,
  ) {
    return await this.appService.updateReadStatus({ id, read });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('notifications/:id')
  async httpDeleteNotification(@Param('id') id: string) {
    return await this.appService.deleteNotification({ id });
  }
  // ----- Course endpoints -----
  @Get('courses')
  async httpGetAllCourses() {
    return await this.appService.getAllCourses();
  }

  @Get('courses/:id')
  async httpGetCourse(@Param('id') id: string) {
    return await this.appService.getCourse({ id });
  }

  @Post('courses')
  @UseGuards(JwtAuthGuard)
  async httpCreateCourse(@Body() body: any) {
    return await this.appService.createCourse(body);
  }

  @Put('courses/:id')
  @UseGuards(JwtAuthGuard)
  async httpUpdateCourse(@Param('id') id: string, @Body() body: any) {
    return await this.appService.updateCourse({ id, dto: body });
  }

  @Delete('courses/:id')
  @UseGuards(JwtAuthGuard)
  async httpDeleteCourse(@Param('id') id: string) {
    return await this.appService.deleteCourse({ id });
  }
  
  // -------- AUTH --------

  @Post('auth/register')
  async register(
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.appService.register(body);

    if (!result?.success) return result;

    
    const refreshInfo = result.data.refreshTokenInfo;
    res.cookie(refreshInfo.name, refreshInfo.value, refreshInfo.options);

    return {
      success: true,
      message: result.message,
      user: result.data.user,
      accessToken: result.data.accessToken,
    };
  }

  @Post('auth/login')
  async login(
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.appService.login(body);

    if (!result?.success) return result;

    const refreshInfo = result.data.refreshTokenInfo;
    res.cookie(refreshInfo.name, refreshInfo.value, refreshInfo.options);

    return {
      success: true,
      message: result.message,
      user: result.data.user,
      accessToken: result.data.accessToken,
    };
  }

  // Access token hết hạn => client gọi endpoint này
  // refreshToken được đọc từ cookie HttpOnly
  @Post('auth/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refreshToken'];

    const result = await this.appService.refresh({ refreshToken });

    if (!result?.success) return result;

    // Gửi lại cookie refreshToken. (ở đây vẫn là token cũ,
    // nhưng ta set lại maxAge trên browser để nó sống tiếp tới hết hạn thực sự)
    const refreshInfo = result.data.refreshTokenInfo;
    res.cookie(refreshInfo.name, refreshInfo.value, refreshInfo.options);

    return {
      success: true,
      message: result.message,
      accessToken: result.data.accessToken,
    };
  }

  @Post('auth/revoke')
  async revoke(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refreshToken'];

    const result = await this.appService.revoke({ refreshToken });

    // Xoá cookie phía client khi logout
    res.clearCookie('refreshToken', { path: '/auth/refresh' });

    return result;
  }

  // -------- PROTECTED RESOURCES --------
  // Mọi request cần access token đều sẽ đi qua guard này
  // login, register, refresh thì không dùng guard
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getAllUsers() {
    return await this.appService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return await this.appService.getUser({ id });
  }

  @UseGuards(JwtAuthGuard)
  @Post('users')
  async createUser(@Body() body: any) {
    return await this.appService.createUser(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return await this.appService.updateUser({ id, dto: body });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return await this.appService.deleteUser({ id });
  }
}
