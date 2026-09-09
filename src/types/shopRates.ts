export type Metal = 'gold' | 'silver';

export type ShopRateMode = 'follow_live' | 'offset' | 'fixed';

export type RateUnit = 'gram' | 'tola';

export type GoldPurity = '24K' | '22K' | '21K' | '18K';

export interface ShopRateConfig {
  metal: Metal;

  /**
   * How the shop rate is calculated from the live market rate.
   */
  mode: ShopRateMode;

  /**
   * Used when mode === 'offset'.
   *
   * Example:
   * live = 40000
   * offset = 500
   * result = 40500
   */
  offset?: number;

  /**
   * Used when mode === 'fixed'.
   */
  fixedRate?: number;

  /**
   * Whether this rate is currently active/published.
   */
  enabled?: boolean;
}

export interface GoldPurityRates {
  '24K': number;
  '22K': number;
  '21K': number;
  '18K': number;
}

export interface ShopRateResult {
  metal: Metal;
  unit: RateUnit;

  /**
   * Final customer-facing sell rate.
   */
  sellRate: number;

  /**
   * Customer buy-back / shop purchase rate.
   */
  buyRate: number;

  /**
   * Base live market rate used for calculation.
   */
  liveRate: number;

  /**
   * Rate calculation mode.
   */
  mode: ShopRateMode;

  /**
   * Optional gold purity rates.
   * Present for gold, undefined for silver.
   */
  purityRates?: GoldPurityRates;
}

export interface RateValidationResult {
  valid: boolean;
  error?: string;
}