import { describe, expect, it } from 'vitest'
import {
  portfolioActualInput,
  portfolioContributionPoints,
  portfolioEndPoint,
} from '../data/portfolioWhatIfData'
import {
  calculatePortfolioActualResult,
  calculatePortfolioWhatIf,
  groupContributionsByYear,
  type PortfolioContributionPoint,
  type PortfolioValuationPoint,
} from './portfolioWhatIf'

describe('portfolio what-if calculations', () => {
  it('calculates actual result from the Gotrade return formula inputs', () => {
    const actual = calculatePortfolioActualResult(portfolioActualInput)

    expect(actual.finalPhp).toBeCloseTo(648685.05, 2)
    expect(actual.totalReturnsPhp).toBeCloseTo(348685.05, 2)
    expect(actual.returnPct).toBeCloseTo(116.228, 3)
    expect(actual.fxImpactPhp).toBeCloseTo(44975.60, 2)
    expect(actual.fxImpactPctPoints).toBeCloseTo(14.992, 3)
  })

  it('computes benchmark results from USD credited, asset prices, and ending FX', () => {
    const sp500 = calculatePortfolioWhatIf('sp500', 'sameTiming', portfolioContributionPoints, portfolioEndPoint)

    expect(sp500.returnPct)
      .toBeCloseTo(79.192, 3)
    expect(sp500.fxImpact.effectiveEntryUsdPhp).toBeCloseTo(55.244, 3)
    expect(sp500.fxImpact.endingUsdPhp).toBeCloseTo(61.377, 3)
    expect(sp500.fxImpact.impactPctPoints).toBeCloseTo(17.904, 3)
    expect(calculatePortfolioWhatIf('nasdaq100', 'sameTiming', portfolioContributionPoints, portfolioEndPoint).returnPct)
      .toBeCloseTo(104.868, 3)
    expect(calculatePortfolioWhatIf('bitcoin', 'sameTiming', portfolioContributionPoints, portfolioEndPoint).returnPct)
      .toBeCloseTo(129.205, 3)
  })

  it('groups yearly contributions on the first contribution point for that year', () => {
    const grouped = groupContributionsByYear(portfolioContributionPoints)

    expect(grouped).toHaveLength(5)
    expect(grouped[0].date).toBe('2021-09-02')
    expect(grouped[0].amountPhp).toBeCloseTo(38615.92, 2)
    expect(grouped[0].amountUsd).toBeCloseTo(754.52, 2)
    expect(grouped[1].date).toBe('2022-01-04')
    expect(grouped[1].amountPhp).toBeCloseTo(112525.95, 2)
    expect(grouped[1].amountUsd).toBeCloseTo(2082.72, 2)
  })

  it('matches a synthetic PHP-to-USD-to-asset-to-PHP example', () => {
    const points: PortfolioContributionPoint[] = [
      {
        amountUsd: 20,
        amountPhp: 1000,
        assets: {
          bitcoin: { date: '2020-01-01', price: 10 },
          nasdaq100: { date: '2020-01-01', price: 10 },
          sp500: { date: '2020-01-01', price: 10 },
        },
        date: '2020-01-01',
        fxDate: '2020-01-01',
        usdPhp: 50,
      },
    ]
    const endPoint: PortfolioValuationPoint = {
      assets: {
        bitcoin: { date: '2021-01-01', price: 20 },
        nasdaq100: { date: '2021-01-01', price: 20 },
        sp500: { date: '2021-01-01', price: 20 },
      },
      date: '2021-01-01',
      fxDate: '2021-01-01',
      usdPhp: 60,
    }

    const result = calculatePortfolioWhatIf('sp500', 'sameTiming', points, endPoint)

    expect(result.finalPhp).toBe(2400)
    expect(result.fxImpact.effectiveEntryUsdPhp).toBe(50)
    expect(result.fxImpact.endingUsdPhp).toBe(60)
    expect(result.fxImpact.impactPhp).toBe(400)
    expect(result.fxImpact.impactPctPoints).toBe(40)
    expect(result.returnPct).toBe(140)
  })
})
