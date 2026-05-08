import type {
  CalculatorAssetKey,
  PesoMarketPoint,
  PriceAssetKey,
} from '../data/pesoMarketData'

export const savingsTaxRate = 0.2

export type ContributionStrategy = 'yearly' | 'monthly'

export type InvestmentScenarioInput = {
  asset: CalculatorAssetKey
  annualBudget: number
  years: number
  savingsRate: number
  marketData: PesoMarketPoint[]
  mp2DividendRates: Record<number, number>
}

export type InvestmentScenarioResult = {
  assetMarketData: PesoMarketPoint[]
  contributionPoints: PesoMarketPoint[]
  endPoint: PesoMarketPoint
  fxImpact?: {
    monthly: UsdFxImpact
    yearly: UsdFxImpact
  }
  maxYears: number
  monthlyBudget: number
  monthlyValue: number
  savingsValue: number
  startPoint: PesoMarketPoint
  totalContributed: number
  yearlyValue: number
}

export type UsdFxImpact = {
  effectiveEntryUsdPhp: number
  endingUsdPhp: number
  impactPctPoints: number
  impactPhp: number
}

export const isPriceAsset = (value: CalculatorAssetKey): value is PriceAssetKey => value !== 'mp2'
export const isPhpPricedAsset = (value: CalculatorAssetKey) => value === 'psei' || value === 'jfc'
export const isUsdPricedAsset = (value: CalculatorAssetKey) => isPriceAsset(value) && !isPhpPricedAsset(value)

export const getAssetMarketData = (
  asset: CalculatorAssetKey,
  marketData: PesoMarketPoint[],
) => {
  if (!isPriceAsset(asset))
    return marketData

  return marketData.filter(point => Boolean(point.assets[asset]?.price))
}

export const getContributionPoints = (
  assetMarketData: PesoMarketPoint[],
  years: number,
) => {
  const contributionMonths = years * 12
  const endIndexExclusive = assetMarketData.length - 1
  const startIndex = Math.max(0, endIndexExclusive - contributionMonths)

  return assetMarketData.slice(startIndex, endIndexExclusive)
}

const priceForPoint = (asset: PriceAssetKey, point: PesoMarketPoint) => point.assets[asset]?.price ?? 0

const pesoToAssetUnits = (asset: PriceAssetKey, amountPhp: number, point: PesoMarketPoint) => {
  if (!isUsdPricedAsset(asset))
    return amountPhp / priceForPoint(asset, point)

  return (amountPhp / point.usdPhp) / priceForPoint(asset, point)
}

const assetUnitsToPhp = (asset: PriceAssetKey, units: number, endPoint: PesoMarketPoint) => {
  const endingValue = units * priceForPoint(asset, endPoint)

  if (!isUsdPricedAsset(asset))
    return endingValue

  return endingValue * endPoint.usdPhp
}

const contributionForStrategy = (
  strategy: ContributionStrategy,
  annualBudget: number,
  index: number,
) => {
  if (strategy === 'yearly')
    return index % 12 === 0 ? annualBudget : 0

  return annualBudget / 12
}

export const calculatePriceAssetValue = (
  asset: PriceAssetKey,
  contributionPoints: PesoMarketPoint[],
  endPoint: PesoMarketPoint,
  annualBudget: number,
  strategy: ContributionStrategy,
) => {
  const units = contributionPoints.reduce((sum, point, index) => {
    const contribution = contributionForStrategy(strategy, annualBudget, index)
    return sum + pesoToAssetUnits(asset, contribution, point)
  }, 0)

  return assetUnitsToPhp(asset, units, endPoint)
}

export const calculateUsdFxImpact = (
  asset: PriceAssetKey,
  contributionPoints: PesoMarketPoint[],
  endPoint: PesoMarketPoint,
  annualBudget: number,
  strategy: ContributionStrategy,
): UsdFxImpact => {
  if (!isUsdPricedAsset(asset))
    throw new Error(`FX impact is only available for USD-priced assets: ${asset}`)

  let totalPhp = 0
  let totalUsd = 0
  let units = 0

  contributionPoints.forEach((point, index) => {
    const contribution = contributionForStrategy(strategy, annualBudget, index)

    if (contribution <= 0)
      return

    totalPhp += contribution
    totalUsd += contribution / point.usdPhp
    units += pesoToAssetUnits(asset, contribution, point)
  })

  const effectiveEntryUsdPhp = totalPhp / totalUsd
  const endingUsdValue = units * priceForPoint(asset, endPoint)
  const impactPhp = endingUsdValue * (endPoint.usdPhp - effectiveEntryUsdPhp)

  return {
    effectiveEntryUsdPhp,
    endingUsdPhp: endPoint.usdPhp,
    impactPctPoints: (impactPhp / totalPhp) * 100,
    impactPhp,
  }
}

const mp2RateForMonth = (month: string, mp2DividendRates: Record<number, number>) => {
  let year = Number(month.slice(0, 4))
  while (year >= 2016) {
    if (mp2DividendRates[year] !== undefined)
      return mp2DividendRates[year]
    year -= 1
  }
  return mp2DividendRates[2016]
}

export const calculateMp2Value = (
  contributionPoints: PesoMarketPoint[],
  annualBudget: number,
  strategy: ContributionStrategy,
  mp2DividendRates: Record<number, number>,
) => {
  let balance = 0
  let yearlyBalanceTotal = 0

  contributionPoints.forEach((point, index) => {
    balance += contributionForStrategy(strategy, annualBudget, index)
    yearlyBalanceTotal += balance

    if (point.month.endsWith('-12')) {
      const averageYearlyBalance = yearlyBalanceTotal / 12
      balance += averageYearlyBalance * mp2RateForMonth(point.month, mp2DividendRates)
      yearlyBalanceTotal = 0
    }
  })

  return balance
}

export const calculateSavingsValue = (
  contributionPoints: PesoMarketPoint[],
  annualBudget: number,
  savingsRate: number,
) => {
  const grossMonthlyRate = (1 + savingsRate / 100) ** (1 / 12) - 1
  const monthlyRate = grossMonthlyRate * (1 - savingsTaxRate)

  return contributionPoints.reduce((sum, _point, index) => {
    const contribution = index % 12 === 0 ? annualBudget : 0
    return (sum + contribution) * (1 + monthlyRate)
  }, 0)
}

export const calculateInvestmentScenario = ({
  asset,
  annualBudget,
  years,
  savingsRate,
  marketData,
  mp2DividendRates,
}: InvestmentScenarioInput): InvestmentScenarioResult => {
  const assetMarketData = getAssetMarketData(asset, marketData)
  const contributionPoints = getContributionPoints(assetMarketData, years)
  const startPoint = contributionPoints[0]
  const endPoint = assetMarketData[assetMarketData.length - 1]
  const monthlyBudget = annualBudget / 12
  const totalContributed = annualBudget * years
  const maxYears = Math.max(1, Math.floor((assetMarketData.length - 1) / 12))

  if (!startPoint || !endPoint)
    throw new Error(`Not enough market data to calculate ${asset}`)

  const yearlyValue = asset === 'mp2'
    ? calculateMp2Value(contributionPoints, annualBudget, 'yearly', mp2DividendRates)
    : calculatePriceAssetValue(asset, contributionPoints, endPoint, annualBudget, 'yearly')

  const monthlyValue = asset === 'mp2'
    ? calculateMp2Value(contributionPoints, annualBudget, 'monthly', mp2DividendRates)
    : calculatePriceAssetValue(asset, contributionPoints, endPoint, annualBudget, 'monthly')
  const fxImpact = isUsdPricedAsset(asset)
    ? {
        monthly: calculateUsdFxImpact(asset, contributionPoints, endPoint, annualBudget, 'monthly'),
        yearly: calculateUsdFxImpact(asset, contributionPoints, endPoint, annualBudget, 'yearly'),
      }
    : undefined

  return {
    assetMarketData,
    contributionPoints,
    endPoint,
    fxImpact,
    maxYears,
    monthlyBudget,
    monthlyValue,
    savingsValue: calculateSavingsValue(contributionPoints, annualBudget, savingsRate),
    startPoint,
    totalContributed,
    yearlyValue,
  }
}
