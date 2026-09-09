import {
  buildShopRateResult,
  calculateGoldPurityRates,
  calculateShopRate,
  gramToTola,
  roundRate,
  tolaToGram,
  validateBuySellRates,
} from '../shopRateEngine';

describe('shopRateEngine', () => {
  describe('roundRate', () => {
    it('rounds a rate to 2 decimal places', () => {
      expect(roundRate(123.456)).toBe(123.46);
    });

    it('supports custom decimal places', () => {
      expect(roundRate(123.4567, 4)).toBe(123.4567);
    });
  });

  describe('Tola / Gram conversion', () => {
    it('converts 1 tola to 11.664 grams', () => {
      expect(tolaToGram(1)).toBe(11.664);
    });

    it('converts 11.664 grams to 1 tola', () => {
      expect(gramToTola(11.664)).toBe(1);
    });
  });

  describe('calculateShopRate', () => {
    it('returns live rate for follow_live mode', () => {
      const result = calculateShopRate(400000, {
        metal: 'gold',
        mode: 'follow_live',
      });

      expect(result).toBe(400000);
    });

    it('adds positive offset', () => {
      const result = calculateShopRate(400000, {
        metal: 'gold',
        mode: 'offset',
        offset: 2000,
      });

      expect(result).toBe(402000);
    });

    it('applies negative offset', () => {
      const result = calculateShopRate(400000, {
        metal: 'gold',
        mode: 'offset',
        offset: -1000,
      });

      expect(result).toBe(399000);
    });

    it('uses fixed rate', () => {
      const result = calculateShopRate(400000, {
        metal: 'gold',
        mode: 'fixed',
        fixedRate: 405000,
      });

      expect(result).toBe(405000);
    });

    it('rejects invalid fixed rate', () => {
      expect(() =>
        calculateShopRate(400000, {
          metal: 'gold',
          mode: 'fixed',
          fixedRate: -1,
        }),
      ).toThrow('Invalid fixed shop rate.');
    });
  });

  describe('calculateGoldPurityRates', () => {
    it('calculates all gold purity rates from 24K', () => {
      const rates = calculateGoldPurityRates(400000);

      expect(rates['24K']).toBe(400000);
      expect(rates['22K']).toBe(366666.67);
      expect(rates['21K']).toBe(350000);
      expect(rates['18K']).toBe(300000);
    });
  });

  describe('validateBuySellRates', () => {
    it('accepts buy rate below sell rate', () => {
      const result = validateBuySellRates(395000, 400000);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts equal buy and sell rates', () => {
      const result = validateBuySellRates(400000, 400000);

      expect(result.valid).toBe(true);
    });

    it('rejects buy rate above sell rate', () => {
      const result = validateBuySellRates(405000, 400000);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Buy rate cannot be higher than sell rate.',
      );
    });

    it('rejects negative buy rate', () => {
      const result = validateBuySellRates(-1, 400000);

      expect(result.valid).toBe(false);
    });
  });

  describe('buildShopRateResult', () => {
    it('builds a Gold shop rate with purity rates', () => {
      const result = buildShopRateResult({
        metal: 'gold',
        unit: 'tola',
        liveRate: 400000,
        sellConfig: {
          metal: 'gold',
          mode: 'offset',
          offset: 2000,
        },
        buyRate: 400000,
      });

      expect(result.metal).toBe('gold');
      expect(result.unit).toBe('tola');
      expect(result.liveRate).toBe(400000);
      expect(result.sellRate).toBe(402000);
      expect(result.buyRate).toBe(400000);

      expect(result.purityRates).toEqual({
        '24K': 402000,
        '22K': 368500,
        '21K': 351750,
        '18K': 301500,
      });
    });

    it('builds a Silver shop rate without gold purity rates', () => {
      const result = buildShopRateResult({
        metal: 'silver',
        unit: 'tola',
        liveRate: 7000,
        sellConfig: {
          metal: 'silver',
          mode: 'offset',
          offset: 100,
        },
        buyRate: 6900,
      });

      expect(result.metal).toBe('silver');
      expect(result.sellRate).toBe(7100);
      expect(result.buyRate).toBe(6900);
      expect(result.purityRates).toBeUndefined();
    });

    it('rejects a buy rate higher than sell rate', () => {
      expect(() =>
        buildShopRateResult({
          metal: 'gold',
          unit: 'tola',
          liveRate: 400000,
          sellConfig: {
            metal: 'gold',
            mode: 'follow_live',
          },
          buyRate: 405000,
        }),
      ).toThrow('Buy rate cannot be higher than sell rate.');
    });
  });
});