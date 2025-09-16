
export type CampaignStatus =
  | 'Draft'
  | 'Submitted'
  | 'Active'
  | 'Completed'
  | 'Validated'
  | 'Returned';

export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  'Draft',
  'Submitted',
  'Active',
  'Completed',
  'Validated',
  'Returned',
];

export type PlatformName = 'Shopee' | 'Lazada' | 'Tiktok';

export const PLATFORMS: PlatformName[] = ['Shopee', 'Lazada', 'Tiktok'];

export type CampaignType =
  | 'Lazada Campaign'
  | 'Shopee Campaign'
  | 'Tiktok Campaign'
  | 'GWP Freebies'
  | 'GWP SKUs'
  | 'Bundle Deals'
  | 'Fake Pricing'
  | 'Vouchers'
  | 'Direct Campaign';

export const CAMPAIGN_TYPES: CampaignType[] = [
  'Lazada Campaign',
  'Shopee Campaign',
  'Tiktok Campaign',
  'GWP Freebies',
  'GWP SKUs',
  'Bundle Deals',
  'Fake Pricing',
  'Vouchers',
  'Direct Campaign',
];

export type ProductPromotion = {
  barcode: string;
  productName: string;
  srp: number;
  discountedPrice?: number;
  discountValue?: number;
  discountPercentage?: number;
};

export type Campaign = {
  id: string;
  programName: string;
  brandName?: string;
  campaignType: CampaignType;
  startDate: string;
  endDate: string;
  objectives: string;
  status: CampaignStatus;
  remarks?: string;
  createdBy: string;
  createdAt: string;
  
  // New fields from trade letter
  tradeLetterDate?: string;
  distributor?: string;
  promotionDuration?: string;
  website?: string;
  extractedRemarks?: string;
  promotions?: ProductPromotion[];
  approvers?: string[];
  tradeLetterDataUri?: string;
};

export type SKUItem = {
  id: string;
  platform?: string;
  sku?: string;
  productName?: string;
  businessUnit?: string;
  brand?: string;
  subBrand?: string;
  caseConfiguration?: string;
  unitOfMeasure?: string;
  srpPerCaseVatin?: number | string;
  srpPerCaseVatex?: number | string;
  srpPerPieceVatin?: number | string;
  srpPerPieceVatex?: number | string;
  dateStart?: string;
  dateEnd?: string;
  timeStart?: string;
  timeEnd?: string;
  remarks?: string;
  lazadaShopSku?: string;
  shopeeProductId?: string;
  shopeeVariationId?: string;
};

export type SrpVersion = {
  version: number;
  timestamp: string;
  reason: string;
  user: string;
  data: SKUItem[];
  originalFileName?: string;
};

export type SrpHistory = SrpVersion[];
