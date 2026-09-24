import { BadRequestException } from '@nestjs/common';

/**
 * 承保范围/费率因子 归一化别名层（只读兜底，仅代码内维护，PRD §8.2/§8.3）。
 *
 * 历史种子数据使用 PascalCase 展示名（如 "MedicalPayments"、"Liability"），
 * 字典化后统一为 camelCase 稳定 code。本表把「入参/存储值（小写化）」映射回
 * 稳定 code，产品表 coverages 的存量值与集成 match 入参都经此归一化。
 * 二期字典化费率因子前，FACTOR_ALIASES 保留为唯一口径。
 */

/** 入参/存储值（小写）→ 稳定 code 的归一化表 */
export const COVERAGE_ALIASES: Record<string, string> = {
  liability: 'liability', comprehensive: 'comprehensive', collision: 'collision',
  medical: 'medical', medicalpayments: 'medical',
  um: 'um', uninsuredmotorist: 'um',
  roadside: 'roadside', roadsideassistance: 'roadside',
  substitute: 'substitute', vehiclereplacement: 'substitute',
  newcarvalue: 'newCarValue', deductiblewaiver: 'deductibleWaiver',
};

export const FACTOR_ALIASES: Record<string, string> = {
  drivingrecord: 'drivingRecord', vehicletype: 'vehicleType', drivingexperience: 'drivingExperience',
  creditscore: 'creditScore', territory: 'territory', region: 'territory', usage: 'usage',
  ageband: 'ageBand', age: 'ageBand', claimshistory: 'claimsHistory',
  vehiclevalue: 'vehicleValue', safetyequip: 'safetyEquip',
};

export const normKeys = (vals: unknown, aliases: Record<string, string>): string[] => {
  if (!Array.isArray(vals)) return [];
  const out: string[] = [];
  for (const v of vals) {
    const k = aliases[String(v).trim().toLowerCase()];
    if (k && !out.includes(k)) out.push(k);
  }
  return out;
};

/** 校验入参数组中的每个值都能归一化（非法值抛业务 code），返回归一化结果 */
export const parseKeys = (vals: string[] | undefined, aliases: Record<string, string>, code: string): string[] => {
  if (!vals) return [];
  for (const v of vals) {
    if (!aliases[String(v).trim().toLowerCase()]) throw new BadRequestException({ code, invalid: v });
  }
  return normKeys(vals, aliases);
};

/** 某稳定 code 的全部小写变体（含历史别名），用于 SQL 侧 count 统计 */
export const aliasVariantsOf = (code: string, aliases: Record<string, string> = COVERAGE_ALIASES): string[] =>
  Array.from(new Set(Object.entries(aliases).filter(([, v]) => v === code).map(([k]) => k)));
