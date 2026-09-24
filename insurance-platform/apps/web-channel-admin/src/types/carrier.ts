// 保险公司数据模型
export interface InsuranceCarrier {
  carrierId: string;              // 公司代码 (主键)
  naicCode: string;               // NAIC 编码
  carrierName: string;            // 公司全称
  shortName?: string;             // 简称
  type: 'Admitted' | 'Non-Admitted';
  rating?: 'A++' | 'A+' | 'A' | 'A-' | 'B+' | 'B';
  status: 'active' | 'inactive' | 'pending';
  region?: string;                // 总部大区 (Northeast/Southeast/West/Midwest)
  naicsDescription?: string;      // NAICS 行业描述
  contactInfo?: {
    address?: string;
    phone?: string;
    email?: string;
  };
  settlementConfig?: {
    currency: string;
    paymentTermDays: number;
    settlementCycle: 'Monthly' | 'Quarterly';
  };
  revenue?: number;               // 总保费收入
  policyCount?: number;           // 保单数
  lossRatio?: number;             // 赔付率
  renewalRate?: number;           // 续保率
  createdAt?: Date;
  updatedAt?: Date;
}
