// Libraries
import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// Common
import { CoreResponse } from '@app/common/dtos/CoreResponse.dto';
import { CustomError } from '@app/common/enums/customError.enum';

// Auth
import { AuthService } from '@app/auth/auth.service';
import { LoginDto } from '@app/auth/dtos/login.dto';
import { RegistrationDto } from '@app/auth/dtos/registration.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Set cookie token',
    type: CoreResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Wrong login or password',
    type: CoreResponse,
  })
  @UsePipes(ValidationPipe)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CoreResponse> {
    const result = await this.authService.login(loginDto);

    if ((result as CoreResponse).error === CustomError.WrongLoginOrPassword) {
      res.status(HttpStatus.UNAUTHORIZED);
      return result as CoreResponse;
    }

    res.cookie('jwt', result['access_token'], {
      maxAge: 36000000,
      sameSite: 'none',
      secure: true,
    });
    return {
      isSuccess: true,
    };
  }

  @Post('register')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Register new user and set token to cookie',
    type: CoreResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Username incompatible with pattern',
    type: CoreResponse,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exist',
    type: CoreResponse,
  })
  async register(
    @Body() registrationDto: RegistrationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CoreResponse> {
    const result = await this.authService.register(registrationDto);

    if ((result as CoreResponse).error === CustomError.AlreadyExist) {
      res.status(HttpStatus.CONFLICT);
      return result as CoreResponse;
    }

    if (
      (result as CoreResponse).error ===
      CustomError.UsernameIncompatibleWithPattern
    ) {
      res.status(HttpStatus.BAD_REQUEST);
      return result as CoreResponse;
    }

    res.cookie('jwt', result['access_token'], {
      maxAge: 36000000,
      sameSite: 'none',
      secure: true,
    });
    return {
      isSuccess: true,
    };
  }

  @Post('logout')
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<CoreResponse> {
    res.cookie('jwt', '', {
      expires: new Date(1),
      sameSite: 'none',
      secure: true,
    });

    return {
      isSuccess: true,
    };
  }
}
