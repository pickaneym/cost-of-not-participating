import { describe, expect, it } from 'vitest'
import {
  assetOptions,
  mp2DividendRates,
  pesoMarketData,
  type CalculatorAssetKey,
  type PesoMarketPoint,
  type PriceAssetKey,
} from '../data/pesoMarketData'
import {
  calculateInvestmentScenario,
  calculateUsdFxImpact,
  isPhpPricedAsset,
  isPriceAsset,
  isUsdPricedAsset,
  savingsTaxRate,
} from './investmentCalculator'

const annualBudget = 60000
const years = 5
const savingsRate = 3
const priceAssets = assetOptions
  .filter((option): option is { key: PriceAssetKey, label: string, kind: 'price' } => option.kind === 'price')
  .map(option => option.key)

const getPrice = (asset: PriceAssetKey, point: PesoMarketPoint) => {
  const price = point.assets[asset]?.price

  if (!price)
    throw new Error(`Missing ${asset} price for ${point.month}`)

  return price
}

const getAssetPoints = (asset: PriceAssetKey) => (
  pesoMarketData.filter(point => Boolean(point.assets[asset]?.price))
)

const getContributionPoints = (points: PesoMarketPoint[], scenarioYears: number) => {
  const endIndexExclusive = points.length - 1
  return points.slice(Math.max(0, endIndexExclusive - scenarioYears * 12), endIndexExclusive)
}

const expectedPriceAssetValue = (
  asset: PriceAssetKey,
  strategy: 'yearly' | 'monthly',
) => {
  const points = getAssetPoints(asset)
  const contributionPoints = getContributionPoints(points, years)
  const endPoint = points[points.length - 1]
  const units = contributionPoints.reduce((sum, point, index) => {
    const contribution = strategy === 'yearly'
      ? (index % 12 === 0 ? annualBudget : 0)
      : annualBudget / 12

    if (isUsdPricedAsset(asset))
      return sum + ((contribution / point.usdPhp) / getPrice(asset, point))

    return sum + (contribution / getPrice(asset, point))
  }, 0)

  const endingValue = units * getPrice(asset, endPoint)
  return isUsdPricedAsset(asset) ? endingValue * endPoint.usdPhp : endingValue
}

const expectedSavingsValue = () => {
  const points = getContributionPoints(pesoMarketData, years)
  const grossMonthlyRate = (1 + savingsRate / 100) ** (1 / 12) - 1
  const monthlyRate = grossMonthlyRate * (1 - savingsTaxRate)

  return points.reduce((sum, _point, index) => {
    const contribution = index % 12 === 0 ? annualBudget : 0
    return (sum + contribution) * (1 + monthlyRate)
  }, 0)
}

const makeMonthlyPoints = (startYear: number, monthCount: number) => (
  Array.from({ length: monthCount }, (_, index): PesoMarketPoint => {
    const monthIndex = index % 12
    const year = startYear + Math.floor(index / 12)
    const month = String(monthIndex + 1).padStart(2, '0')

    return {
      assets: {},
      fxDate: `${year}-${month}-20`,
      month: `${year}-${month}`,
      usdPhp: 50,
    }
  })
)

const makeKnownAnswerPriceData = () => (
  makeMonthlyPoints(2020, 13).map((point, index) => ({
    ...point,
    assets: {
      psei: { date: point.fxDate, price: index === 0 ? 10 : 20 },
      sp500: { date: point.fxDate, price: index === 0 ? 10 : 20 },
    },
    usdPhp: index === 12 ? 60 : 50,
  }))
)

describe('investment calculator asset handling', () => {
  it('classifies currency paths correctly', () => {
    expect(isUsdPricedAsset('sp500')).toBe(true)
    expect(isUsdPricedAsset('aapl')).toBe(true)
    expect(isUsdPricedAsset('nvda')).toBe(true)
    expect(isPhpPricedAsset('psei')).toBe(true)
    expect(isPhpPricedAsset('jfc')).toBe(true)
    expect(isPriceAsset('mp2' as CalculatorAssetKey)).toBe(false)
  })

  it.each(priceAssets)('calculates yearly and monthly values for %s', (asset) => {
    const scenario = calculateInvestmentScenario({
      annualBudget,
      asset,
      marketData: pesoMarketData,
      mp2DividendRates,
      savingsRate,
      years,
    })

    expect(scenario.contributionPoints).toHaveLength(years * 12)
    expect(scenario.totalContributed).toBe(annualBudget * years)
    expect(scenario.yearlyValue).toBeCloseTo(expectedPriceAssetValue(asset, 'yearly'), 6)
    expect(scenario.monthlyValue).toBeCloseTo(expectedPriceAssetValue(asset, 'monthly'), 6)
    expect(scenario.savingsValue).toBeCloseTo(expectedSavingsValue(), 6)
  })

  it('keeps S&P 500 yearly strategy as annual upfront contributions, not one all-in deposit', () => {
    const scenario = calculateInvestmentScenario({
      annualBudget,
      asset: 'sp500',
      marketData: pesoMarketData,
      mp2DividendRates,
      savingsRate,
      years,
    })
    const points = getAssetPoints('sp500')
    const contributionPoints = getContributionPoints(points, years)
    const startPoint = contributionPoints[0]
    const endPoint = points[points.length - 1]
    const allInUnits = ((annualBudget * years) / startPoint.usdPhp) / getPrice('sp500', startPoint)
    const oldAllInValue = allInUnits * getPrice('sp500', endPoint) * endPoint.usdPhp

    expect(Math.round(scenario.yearlyValue)).toBe(555133)
    expect(scenario.yearlyValue).toBeLessThan(oldAllInValue)
  })

  it('uses USD conversion and start-of-month buying for USD-priced assets', () => {
    const scenario = calculateInvestmentScenario({
      annualBudget: 1200,
      asset: 'sp500',
      marketData: makeKnownAnswerPriceData(),
      mp2DividendRates,
      savingsRate: 0,
      years: 1,
    })

    expect(scenario.yearlyValue).toBe(2880)
    expect(scenario.monthlyValue).toBe(1560)
    expect(scenario.fxImpact?.yearly.impactPhp).toBe(480)
    expect(scenario.fxImpact?.yearly.impactPctPoints).toBe(40)
    expect(scenario.fxImpact?.monthly.impactPhp).toBe(260)
    expect(scenario.fxImpact?.monthly.impactPctPoints).toBeCloseTo(21.6667, 4)
  })

  it('ignores USD/PHP conversion and buys at the start of each month for PHP-priced assets', () => {
    const scenario = calculateInvestmentScenario({
      annualBudget: 1200,
      asset: 'psei',
      marketData: makeKnownAnswerPriceData(),
      mp2DividendRates,
      savingsRate: 0,
      years: 1,
    })

    expect(scenario.yearlyValue).toBe(2400)
    expect(scenario.monthlyValue).toBe(1300)
    expect(scenario.fxImpact).toBeUndefined()
  })

  it('rejects FX impact calculations for PHP-priced assets', () => {
    expect(() => calculateUsdFxImpact(
      'psei',
      makeKnownAnswerPriceData().slice(0, 12),
      makeKnownAnswerPriceData()[12],
      1200,
      'monthly',
    )).toThrow('FX impact is only available')
  })
})

describe('investment calculator MP2 and savings handling', () => {
  it('matches a one-year start-of-month MP2 example', () => {
    const scenario = calculateInvestmentScenario({
      annualBudget: 1200,
      asset: 'mp2',
      marketData: makeMonthlyPoints(2020, 13),
      mp2DividendRates: { 2020: 0.1 },
      savingsRate: 0,
      years: 1,
    })

    expect(scenario.yearlyValue).toBe(1320)
    expect(scenario.monthlyValue).toBe(1265)
  })

  it('returns only monthly deposits when savings rate is zero', () => {
    const scenario = calculateInvestmentScenario({
      annualBudget: 1200,
      asset: 'sp500',
      marketData: makeKnownAnswerPriceData(),
      mp2DividendRates,
      savingsRate: 0,
      years: 1,
    })

    expect(scenario.savingsValue).toBe(1200)
  })

  it('matches the common MP2 monthly contribution example with annual reinvested dividends', () => {
    const syntheticMarketData = makeMonthlyPoints(2020, 61)
    const fixedMp2Rates = {
      2020: 0.075,
      2021: 0.075,
      2022: 0.075,
      2023: 0.075,
      2024: 0.075,
    }

    const scenario = calculateInvestmentScenario({
      annualBudget: 6000,
      asset: 'mp2',
      marketData: syntheticMarketData,
      mp2DividendRates: fixedMp2Rates,
      savingsRate,
      years: 5,
    })

    expect(scenario.monthlyValue).toBeCloseTo(36266.14, 2)
  })

  it('calculates MP2 for current historical rates without market prices', () => {
    const scenario = calculateInvestmentScenario({
      annualBudget,
      asset: 'mp2',
      marketData: pesoMarketData,
      mp2DividendRates,
      savingsRate,
      years,
    })

    expect(scenario.contributionPoints).toHaveLength(years * 12)
    expect(scenario.yearlyValue).toBeGreaterThan(scenario.totalContributed)
    expect(scenario.monthlyValue).toBeGreaterThan(scenario.totalContributed)
    expect(scenario.savingsValue).toBeCloseTo(expectedSavingsValue(), 6)
  })
})
