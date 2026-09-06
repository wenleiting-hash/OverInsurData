/**
 * Update User Preferences DTO
 */

import { IsEnum, IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  /**
   * Language code (en-US or zh-CN)
   */
  @IsEnum(['en-US', 'zh-CN'])
  @IsString()
  @ApiProperty({ enum: ['en-US', 'zh-CN'], example: 'zh-CN' })
  languageCode?: string;

  /**
   * Date format pattern
   */
  @IsOptional()
  @IsEnum(['MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'])
  @IsString()
  @ApiProperty({ enum: ['MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'], example: 'YYYY-MM-DD' })
  dateFormat?: string;

  /**
   * IANA time zone
   */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @ApiProperty({ example: 'America/Los_Angeles' })
  timeZone?: string;

  /**
   * Theme mode (light or dark)
   */
  @IsOptional()
  @IsEnum(['light', 'dark'])
  @IsString()
  @ApiProperty({ enum: ['light', 'dark'], example: 'light' })
  themeMode?: string;
}
