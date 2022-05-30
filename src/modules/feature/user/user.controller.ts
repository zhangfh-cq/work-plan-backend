import { AuditUserDto } from './dto/audit.dto';
import { AuthGuard } from '@nestjs/passport';
import { BlockedOperateDto } from './dto/blocked.dto';
import { DeleteUserDto } from './dto/delete.dto';
import { LogoffDto } from './dto/logoff.dto';
import { ROLE } from 'src/enums/user/role.enum';
import { Role } from 'src/decorators/role.decorator';
import { SignupDto } from './dto/signup.dto';
import { UpdateAnyUserDto } from './dto/update-any.dto';
import { UpdateDto } from './dto/update.dto';
import { UpdateUserRoleDto } from './dto/update-role.dto';
import { USER_STATUS } from 'src/enums/user/status.enum';
import { UserSearchOption } from 'src/types/user/search-option.type';
import { UserService } from './user.service';
import {
  Get,
  Body,
  Post,
  Query,
  Request,
  UseGuards,
  Controller,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';

@Controller('user') // 用户控制器
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private userService: UserService) {}

  @Post('signup') // 注册
  async signup(@Body() signupDto: SignupDto) {
    return await this.userService.signup(signupDto);
  }

  @Post('login') // 登录
  @UseGuards(AuthGuard('local'))
  async login(@Request() request: any) {
    return await this.userService.login(request.user.username, request.user.id);
  }

  @Get('info') // 获取登录用户信息
  @UseGuards(AuthGuard('jwt'))
  async getInfo(@Request() request: any) {
    return await this.userService.getInfo(request.user.id);
  }

  @Post('update') // 更新登录用户信息
  @UseGuards(AuthGuard('jwt'))
  async updateInfo(@Request() request: any, @Body() updateDto: UpdateDto) {
    return await this.userService.updateInfo(request.user.id, updateDto);
  }

  @Post('logout') // 登录用户退出
  @UseGuards(AuthGuard('jwt'))
  async signOut() {
    return;
  }

  @Post('logoff') // 登录用户注销
  @UseGuards(AuthGuard('jwt'))
  async logoff(@Request() request: any, @Body() logoffDto: LogoffDto) {
    return await this.userService.logoff(request.user.id, logoffDto);
  }

  // *************************************************************
  // *************************** 管理员 ***************************
  // *************************************************************

  @Get('manage/list') // 获取用户列表
  @Role(ROLE.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async getUserList(
    @Query('start') start: number,
    @Query('count') count: number,
    @Query('option')
    option: UserSearchOption,
    @Query('value') optionValue: string,
    @Query('status') status: USER_STATUS,
  ) {
    return await this.userService.getUserList(
      start,
      count,
      option,
      optionValue,
      status,
    );
  }

  @Post('manage/update') // 更新任意用户信息
  @Role(ROLE.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async updateAnyUser(@Body() updateAnyUserDto: UpdateAnyUserDto) {
    return await this.userService.updateAnyUser(updateAnyUserDto);
  }

  @Post('manage/delete') // 批量删除用户
  @Role(ROLE.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async deleteUsers(@Body() deleteUsersDto: DeleteUserDto) {
    return await this.userService.deleteUsers(deleteUsersDto);
  }

  @Post('manage/audit/signup') // 审核注册用户
  @Role(ROLE.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async auditUsersSignup(@Body() auditSignupDto: AuditUserDto) {
    return await this.userService.auditUsersSignup(auditSignupDto);
  }

  @Post('manage/audit/logoff') // 审核注销用户
  @Role(ROLE.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async auditUsersLogoff(@Body() auditLogoffDto: AuditUserDto) {
    return await this.userService.auditUsersLogoff(auditLogoffDto);
  }

  @Post('manage/blocked') // 用户封禁操作
  @Role(ROLE.ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async operateBlockedUsers(@Body() blockedOperateDto: BlockedOperateDto) {
    return await this.userService.operateBlockedUsers(blockedOperateDto);
  }

  // *************************************************************
  // *************************** 超级管理员 ***********************
  // *************************************************************

  @Post('admin/new') // 更改用户角色为管理员
  @Role(ROLE.SUPER_ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async updateUsersRole(@Body() updateUserRoleDto: UpdateUserRoleDto) {
    return await this.userService.updateUsersRole(updateUserRoleDto);
  }

  @Get('admin/list') // 获取管理员列表
  @Role(ROLE.SUPER_ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async getAdminList(
    @Query('start') start: number,
    @Query('count') count: number,
    @Query('option')
    option: UserSearchOption,
    @Query('value') optionValue: string,
    @Query('status') status: USER_STATUS,
  ) {
    return await this.userService.getAdminList(
      start,
      count,
      option,
      optionValue,
      status,
    );
  }

  @Post('admin/add') // 添加管理员
  @Role(ROLE.SUPER_ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async addAdmin(@Body() addAdminDto: SignupDto) {
    return await this.userService.addAdmin(addAdminDto);
  }

  @Post('admin/update') // 更新管理员信息
  @Role(ROLE.SUPER_ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async updateAnyAdmin(@Body() updateAnyAdminDto: UpdateAnyUserDto) {
    return await this.userService.updateAnyAdmin(updateAnyAdminDto);
  }

  @Post('admin/delete') // 批量删除管理员
  @Role(ROLE.SUPER_ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async deleteAdmins(@Body() deleteAdminsDto: DeleteUserDto) {
    return await this.userService.deleteAdmins(deleteAdminsDto);
  }

  @Post('admin/blocked') // 管理员封禁操作
  @Role(ROLE.SUPER_ADMIN)
  @UseGuards(AuthGuard('jwt'))
  async operateBlockedAdmins(@Body() blockedOperateDto: BlockedOperateDto) {
    return await this.userService.operateBlockedAdmins(blockedOperateDto);
  }
}
