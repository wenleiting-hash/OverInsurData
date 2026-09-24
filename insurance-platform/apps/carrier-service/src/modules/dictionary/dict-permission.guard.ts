/**
 * 险种字典权限守卫（V1.0.18）
 *
 * 管理接口要求权限点 dict:manage（coverage-tree 仅需登录态，不挂本守卫）。
 * 判定：用户任一未删除角色的 permission_keys 含所需权限点，或角色为 super_admin。
 * 权限点语义见 PRD §5； PermissionGuard 为全局桩实现（bypass），本守卫为模块内真实校验。
 */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { pool } from '../../database/drizzle.client';

@Injectable()
export class DictPermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.userId;
    if (!userId) throw new ForbiddenException({ code: 'DICT_FORBIDDEN' });

    const r = await pool.query(
      `SELECT EXISTS (
         SELECT 1
           FROM auth_user u
           JOIN auth_user_role ur ON ur.user_id = u.id
           JOIN auth_role r ON r.role_id = ur.role_id AND r.deleted = FALSE
          WHERE u.user_uuid = $1 AND u.deleted = FALSE
            AND (r.role_key = 'super_admin' OR r.permission_keys ? $2)
       ) AS ok`,
      [userId, 'dict:manage'],
    );
    if (!r.rows[0]?.ok) {
      throw new ForbiddenException({ code: 'DICT_FORBIDDEN' });
    }
    return true;
  }
}
