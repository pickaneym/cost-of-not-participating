export type PortfolioAssetKey = 'sp500' | 'nasdaq100' | 'bitcoin'
export type PortfolioStrategy = 'sameTiming' | 'yearly'

export type PortfolioAssetPrice = {
  date: string
  price: number
}

export type PortfolioValuationPoint = {
  date: string
  fxDate: string
  usdPhp: number
  assets: Record<PortfolioAssetKey, PortfolioAssetPrice>
}

export type PortfolioContributionPoint = PortfolioValuationPoint & {
  amountPhp: number
  amountUsd: number
  bspUsdPhp?: number
}

export type PortfolioResultInput = {
  depositsPhp: number
  cashEquityPhp: number
  fxBaselinePhp?: number
  rewardsPhp: number
  withdrawalsPhp: number
  realisedPhp: number
  unrealisedPhp: number
}

export type PortfolioActualResult = PortfolioResultInput & {
  fxImpactPctPoints?: number
  fxImpactPhp?: number
  finalPhp: number
  returnPct: number
  totalReturnsPhp: number
}

export type PortfolioWhatIfResult = {
  asset: PortfolioAssetKey
  fxImpact: PortfolioUsdFxImpact
  strategy: PortfolioStrategy
  finalPhp: number
  returnPct: number
}

export type PortfolioUsdFxImpact = {
  effectiveEntryUsdPhp: number
  endingUsdPhp: number
  impactPctPoints: number
  impactPhp: number
}

export const calculatePortfolioActualResult = (input: PortfolioResultInput): PortfolioActualResult => {
  const finalPhp = input.cashEquityPhp + input.rewardsPhp + input.withdrawalsPhp
  const totalReturnsPhp = finalPhp - input.depositsPhp
  const fxImpactPhp = input.fxBaselinePhp === undefined
    ? undefined
    : finalPhp - input.fxBaselinePhp

  return {
    ...input,
    finalPhp,
    fxImpactPctPoints: fxImpactPhp === undefined ? undefined : (fxImpactPhp / input.depositsPhp) * 100,
    fxImpactPhp,
    returnPct: (totalReturnsPhp / input.depositsPhp) * 100,
    totalReturnsPhp,
  }
}

const contributionUnits = (
  asset: PortfolioAssetKey,
  point: PortfolioContributionPoint,
) => point.amountUsd / point.assets[asset].price

export const groupContributionsByYear = (
  points: PortfolioContributionPoint[],
): PortfolioContributionPoint[] => {
  const groups = new Map<string, PortfolioContributionPoint>()

  points.forEach((point) => {
    const year = point.date.slice(0, 4)
    const existing = groups.get(year)

    if (!existing) {
      groups.set(year, { ...point })
      return
    }

    existing.amountPhp += point.amountPhp
    existing.amountUsd += point.amountUsd
  })

  return Array.from(groups.values())
}

export const calculatePortfolioWhatIf = (
  asset: PortfolioAssetKey,
  strategy: PortfolioStrategy,
  points: PortfolioContributionPoint[],
  endPoint: PortfolioValuationPoint,
): PortfolioWhatIfResult => {
  const contributionPoints = strategy === 'yearly'
    ? groupContributionsByYear(points)
    : points
  const totalContributed = points.reduce((sum, point) => sum + point.amountPhp, 0)
  const units = contributionPoints.reduce(
    (sum, point) => sum + contributionUnits(asset, point),
    0,
  )
  const endingUsdValue = units * endPoint.assets[asset].price
  const finalPhp = endingUsdValue * endPoint.usdPhp
  const contributionPhp = contributionPoints.reduce((sum, point) => sum + point.amountPhp, 0)
  const contributionUsd = contributionPoints.reduce((sum, point) => sum + point.amountUsd, 0)
  const effectiveEntryUsdPhp = contributionPhp / contributionUsd
  const impactPhp = endingUsdValue * (endPoint.usdPhp - effectiveEntryUsdPhp)

  return {
    asset,
    finalPhp,
    fxImpact: {
      effectiveEntryUsdPhp,
      endingUsdPhp: endPoint.usdPhp,
      impactPctPoints: (impactPhp / totalContributed) * 100,
      impactPhp,
    },
    returnPct: ((finalPhp / totalContributed) - 1) * 100,
    strategy,
  }
}
