import { describe, it, expect } from 'vitest';
import {
  isCouponApplicableToPackage,
  getApplicablePackageNames,
  validateCouponCode,
} from './useCoupons';
import {
  parseApplicablePackages,
  serializeApplicablePackages,
} from '@/pages/admin/Coupons';
import { Coupon } from '@/types/orders';

describe('useCoupons - Multi-Variant Package Discount', () => {
  describe('isCouponApplicableToPackage', () => {
    it('should allow all packages when applicable_to is all, subscription, null or undefined', () => {
      expect(isCouponApplicableToPackage('all', 'lite')).toBe(true);
      expect(isCouponApplicableToPackage('all', 'standar')).toBe(true);
      expect(isCouponApplicableToPackage('all', 'pro')).toBe(true);
      expect(isCouponApplicableToPackage('subscription', 'standar')).toBe(true);
      expect(isCouponApplicableToPackage(null, 'pro')).toBe(true);
      expect(isCouponApplicableToPackage(undefined, 'lite')).toBe(true);
      expect(isCouponApplicableToPackage('all', undefined)).toBe(true);
    });

    it('should correctly match single specific packages', () => {
      expect(isCouponApplicableToPackage('lite', 'lite')).toBe(true);
      expect(isCouponApplicableToPackage('lite', 'standar')).toBe(false);
      expect(isCouponApplicableToPackage('lite', 'pro')).toBe(false);

      expect(isCouponApplicableToPackage('standar', 'standar')).toBe(true);
      expect(isCouponApplicableToPackage('standar', 'lite')).toBe(false);

      expect(isCouponApplicableToPackage('pro', 'pro')).toBe(true);
      expect(isCouponApplicableToPackage('pro', 'standar')).toBe(false);
    });

    it('should handle package aliases (annual <-> standar, pro_annual <-> pro)', () => {
      // standar matches annual
      expect(isCouponApplicableToPackage('standar', 'annual')).toBe(true);
      expect(isCouponApplicableToPackage('annual', 'standar')).toBe(true);

      // pro matches pro_annual
      expect(isCouponApplicableToPackage('pro', 'pro_annual')).toBe(true);
      expect(isCouponApplicableToPackage('pro_annual', 'pro')).toBe(true);
    });

    it('should correctly handle multi-variant combinations (e.g. standar,pro or lite,standar)', () => {
      const multi = 'standar,pro';
      expect(isCouponApplicableToPackage(multi, 'standar')).toBe(true);
      expect(isCouponApplicableToPackage(multi, 'pro')).toBe(true);
      expect(isCouponApplicableToPackage(multi, 'annual')).toBe(true);
      expect(isCouponApplicableToPackage(multi, 'pro_annual')).toBe(true);
      expect(isCouponApplicableToPackage(multi, 'lite')).toBe(false);

      const liteStandar = 'lite,standar';
      expect(isCouponApplicableToPackage(liteStandar, 'lite')).toBe(true);
      expect(isCouponApplicableToPackage(liteStandar, 'standar')).toBe(true);
      expect(isCouponApplicableToPackage(liteStandar, 'pro')).toBe(false);
    });
  });

  describe('getApplicablePackageNames', () => {
    it('returns "Semua Paket" for all, subscription, empty, or all 3 packages', () => {
      expect(getApplicablePackageNames('all')).toBe('Semua Paket');
      expect(getApplicablePackageNames('subscription')).toBe('Semua Paket');
      expect(getApplicablePackageNames(null)).toBe('Semua Paket');
      expect(getApplicablePackageNames('lite,standar,pro')).toBe('Semua Paket');
    });

    it('returns human-readable combined names for multi-variant packages', () => {
      expect(getApplicablePackageNames('standar,pro')).toBe('Paket Standar & Paket Pro');
      expect(getApplicablePackageNames('lite,pro')).toBe('Paket Lite & Paket Pro');
      expect(getApplicablePackageNames('lite,standar')).toBe('Paket Lite & Paket Standar');
    });

    it('returns single package name for single variant', () => {
      expect(getApplicablePackageNames('lite')).toBe('Paket Lite');
      expect(getApplicablePackageNames('standar')).toBe('Paket Standar');
      expect(getApplicablePackageNames('pro')).toBe('Paket Pro');
    });
  });

  describe('validateCouponCode', () => {
    const mockCoupons: Coupon[] = [
      {
        id: '1',
        code: 'DISKONALL',
        name: 'Diskon Semua',
        discount_type: 'percentage',
        discount_value: 20,
        applicable_to: 'all',
        is_active: true,
        used_count: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        code: 'PROSTANDAR',
        name: 'Diskon Standar & Pro',
        discount_type: 'fixed',
        discount_value: 50000,
        applicable_to: 'standar,pro',
        is_active: true,
        used_count: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        code: 'ONLYLITE',
        name: 'Diskon Lite',
        discount_type: 'percentage',
        discount_value: 50,
        max_discount_amount: 30000,
        applicable_to: 'lite',
        is_active: true,
        used_count: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: '4',
        code: 'INACTIVE',
        name: 'Kupon Nonaktif',
        discount_type: 'percentage',
        discount_value: 10,
        applicable_to: 'all',
        is_active: false,
        used_count: 0,
        created_at: new Date().toISOString(),
      },
    ];

    it('validates coupon applicable to all packages', () => {
      const res = validateCouponCode(mockCoupons, 'diskonall', 100000, 'lite');
      expect(res.valid).toBe(true);
      expect(res.discountAmount).toBe(20000);
      expect(res.finalPrice).toBe(80000);
    });

    it('validates multi-variant coupon for allowed package and rejects disallowed package', () => {
      // Allowed on 'standar'
      const resStandar = validateCouponCode(mockCoupons, 'PROSTANDAR', 149000, 'standar');
      expect(resStandar.valid).toBe(true);
      expect(resStandar.discountAmount).toBe(50000);
      expect(resStandar.finalPrice).toBe(99000);

      // Allowed on 'pro'
      const resPro = validateCouponCode(mockCoupons, 'PROSTANDAR', 197000, 'pro');
      expect(resPro.valid).toBe(true);
      expect(resPro.discountAmount).toBe(50000);

      // Disallowed on 'lite'
      const resLite = validateCouponCode(mockCoupons, 'PROSTANDAR', 99000, 'lite');
      expect(resLite.valid).toBe(false);
      expect(resLite.message).toContain('Kupon ini hanya berlaku untuk Paket Standar & Paket Pro');
    });

    it('respects max discount capping', () => {
      const res = validateCouponCode(mockCoupons, 'ONLYLITE', 99000, 'lite');
      expect(res.valid).toBe(true);
      // 50% of 99000 is 49500, capped at 30000
      expect(res.discountAmount).toBe(30000);
      expect(res.finalPrice).toBe(69000);
    });

    it('rejects inactive coupon', () => {
      const res = validateCouponCode(mockCoupons, 'INACTIVE', 100000, 'standar');
      expect(res.valid).toBe(false);
      expect(res.message).toBe('Kupon ini sudah tidak aktif');
    });
  });

  describe('parseApplicablePackages & serializeApplicablePackages (Admin UI)', () => {
    it('parses empty, null, or all to all packages', () => {
      expect(parseApplicablePackages(null)).toEqual(['lite', 'standar', 'pro']);
      expect(parseApplicablePackages('all')).toEqual(['lite', 'standar', 'pro']);
      expect(parseApplicablePackages('subscription')).toEqual(['lite', 'standar', 'pro']);
    });

    it('parses specific comma separated packages', () => {
      expect(parseApplicablePackages('standar,pro')).toEqual(['standar', 'pro']);
      expect(parseApplicablePackages('lite')).toEqual(['lite']);
      expect(parseApplicablePackages('annual,pro_annual')).toEqual(['standar', 'pro']);
    });

    it('serializes all selected variants to "all"', () => {
      expect(serializeApplicablePackages(['lite', 'standar', 'pro'])).toBe('all');
      expect(serializeApplicablePackages([])).toBe('all');
    });

    it('serializes subset of variants to comma-separated string', () => {
      expect(serializeApplicablePackages(['standar', 'pro'])).toBe('standar,pro');
      expect(serializeApplicablePackages(['lite'])).toBe('lite');
      expect(serializeApplicablePackages(['lite', 'pro'])).toBe('lite,pro');
    });
  });
});
