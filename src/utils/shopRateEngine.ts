import {
    GoldPurityRates,
    Metal,
    RateUnit,
    RateValidationResult,
    ShopRateConfig,
    ShopRateMode,
    ShopRateResult,
} from '../types/shopRates';

export const TOLA_TO_GRAMS = 11.664;

const DEFAULT_DECIMAL_PLACES = 2;

/**
 * Round a number to a fixed number of decimal places.
 *
 * This prevents floating-point noise from leaking into
 * customer-facing rates.
 */
export function roundRate(value: number, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    const factor = 10 ** decimalPlaces;

    return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function tolaToGram(tola: number): number {
    if (!Number.isFinite(tola)) {
        return 0;
    }

    return roundRate(tola * TOLA_TO_GRAMS, 4);
}

/**
 * Convert grams to Tola.
 */
export function gramToTola(grams: number): number {
    if (!Number.isFinite(grams)) {
        return 0;
    }

    return roundRate(grams / TOLA_TO_GRAMS, 4);
}

/**
 * Calculate final shop rate from a live market rate.
 *
 * follow_live:
 *   shop rate = live rate
 *
 * offset:
 *   shop rate = live rate + offset
 *
 * fixed:
 *   shop rate = fixedRate
 */
export function calculateShopRate(liveRate: number, config: ShopRateConfig): number {
    if (!Number.isFinite(liveRate) || liveRate < 0) {
        throw new Error('Invalid live market rate.');
    }

    switch (config.mode) {
        case 'follow_live':
            return roundRate(liveRate);

        case 'offset': {
            const offset = config.offset ?? 0;

            if (!Number.isFinite(offset)) {
                throw new Error('Invalid shop rate offset.');
            }

            return roundRate(liveRate + offset);
        }

        case 'fixed': {
            const fixedRate = config.fixedRate;

            if (fixedRate === undefined || !Number.isFinite(fixedRate) || fixedRate < 0) {
                throw new Error('Invalid fixed shop rate.');
            }

            return roundRate(fixedRate);
        }

        default:
            throw new Error(
                `Unsupported shop rate mode: ${String((config as { mode: ShopRateMode }).mode)}`,
            );
    }
}

/**
 * Calculate Gold purity rate from 24K.
 *
 * Standard purity ratios:
 *
 * 24K = 24 / 24
 * 22K = 22 / 24
 * 21K = 21 / 24
 * 18K = 18 / 24
 */
export function calculateGoldPurityRates(rate24K: number): GoldPurityRates {
    if (!Number.isFinite(rate24K) || rate24K < 0) {
        throw new Error('Invalid 24K gold rate.');
    }

    return {
        '24K': roundRate(rate24K),
        '22K': roundRate((rate24K * 22) / 24),
        '21K': roundRate((rate24K * 21) / 24),
        '18K': roundRate((rate24K * 18) / 24),
    };
}

/**
 * Validate Buy/Buy-back and Sell rates.
 *
 * Business rule:
 *
 * buyRate <= sellRate
 */
export function validateBuySellRates(buyRate: number, sellRate: number): RateValidationResult {
    if (!Number.isFinite(buyRate)) {
        return {
            valid: false,
            error: 'Buy rate must be a valid number.',
        };
    }

    if (!Number.isFinite(sellRate)) {
        return {
            valid: false,
            error: 'Sell rate must be a valid number.',
        };
    }

    if (buyRate < 0) {
        return {
            valid: false,
            error: 'Buy rate cannot be negative.',
        };
    }

    if (sellRate < 0) {
        return {
            valid: false,
            error: 'Sell rate cannot be negative.',
        };
    }

    if (buyRate > sellRate) {
        return {
            valid: false,
            error: 'Buy rate cannot be higher than sell rate.',
        };
    }

    return {
        valid: true,
    };
}

/**
 * Build the final Shop Rate object.
 *
 * For Gold:
 *   - calculates 24K base
 *   - derives 22K, 21K and 18K
 *
 * For Silver:
 *   - keeps the supplied rate as the final rate
 */
export function buildShopRateResult(params: {
    metal: Metal;
    unit: RateUnit;
    liveRate: number;
    sellConfig: ShopRateConfig;
    buyRate: number;
}): ShopRateResult {
    const { metal, unit, liveRate, sellConfig, buyRate } = params;

    const sellRate = calculateShopRate(liveRate, sellConfig);

    const validation = validateBuySellRates(buyRate, sellRate);

    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const result: ShopRateResult = {
        metal,
        unit,
        sellRate,
        buyRate: roundRate(buyRate),
        liveRate: roundRate(liveRate),
        mode: sellConfig.mode,
    };

    if (metal === 'gold') {
        result.purityRates = calculateGoldPurityRates(sellRate);
    }

    return result;
}
  describe('edge cases', () => {
    it('returns 0 when rounding an invalid number', () => {
      expect(roundRate(Number.NaN)).toBe(0);
      expect(roundRate(Number.POSITIVE_INFINITY)).toBe(0);
    });

    it('returns 0 for invalid unit conversion input', () => {
      expect(tolaToGram(Number.NaN)).toBe(0);
      expect(gramToTola(Number.NaN)).toBe(0);
    });

    it('rejects a negative live market rate', () => {
      expect(() =>
        calculateShopRate(-1, {
          metal: 'gold',
          mode: 'follow_live',
        }),
      ).toThrow('Invalid live market rate.');
    });

    it('handles zero live market rate', () => {
      const result = calculateShopRate(0, {
        metal: 'gold',
        mode: 'follow_live',
      });

      expect(result).toBe(0);
    });

    it('handles zero offset', () => {
      const result = calculateShopRate(400000, {
        metal: 'gold',
        mode: 'offset',
        offset: 0,
      });

      expect(result).toBe(400000);
    });

    it('rejects NaN offset', () => {
      expect(() =>
        calculateShopRate(400000, {
          metal: 'gold',
          mode: 'offset',
          offset: Number.NaN,
        }),
      ).toThrow('Invalid shop rate offset.');
    });

    it('rejects a negative fixed rate', () => {
      expect(() =>
        calculateShopRate(400000, {
          metal: 'gold',
          mode: 'fixed',
          fixedRate: -500,
        }),
      ).toThrow('Invalid fixed shop rate.');
    });

    it('rejects NaN buy rate', () => {
      const result = validateBuySellRates(Number.NaN, 400000);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Buy rate must be a valid number.',
      );
    });

    it('rejects NaN sell rate', () => {
      const result = validateBuySellRates(395000, Number.NaN);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Sell rate must be a valid number.',
      );
    });

    it('rejects negative sell rate', () => {
      const result = validateBuySellRates(0, -1);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Sell rate cannot be negative.',
      );
    });

    it('rejects invalid 24K gold rate', () => {
      expect(() =>
        calculateGoldPurityRates(-1),
      ).toThrow('Invalid 24K gold rate.');
    });

    it('allows zero 24K gold rate', () => {
      const result = calculateGoldPurityRates(0);

      expect(result).toEqual({
        '24K': 0,
        '22K': 0,
        '21K': 0,
        '18K': 0,
      });
    });
  });
