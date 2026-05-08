<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  portfolioActualInput,
  portfolioContributionPoints,
  portfolioEndPoint,
} from '../data/portfolioWhatIfData'
import {
  calculatePortfolioActualResult,
  calculatePortfolioWhatIf,
  type PortfolioAssetKey,
  type PortfolioStrategy,
  type PortfolioWhatIfResult,
} from '../utils/portfolioWhatIf'

type PortfolioScenario = {
  key: string
  label: string
  asset: string
  method: string
  result: PortfolioWhatIfResult
}

const actualResult = calculatePortfolioActualResult(portfolioActualInput)

const scenarioInputs: Array<{
  key: string
  label: string
  asset: PortfolioAssetKey
  assetLabel: string
  method: string
  strategy: PortfolioStrategy
}> = [
  {
    key: 'sp500_same_timing',
    label: 'S&P 500 - same timing',
    asset: 'sp500',
    assetLabel: 'S&P 500',
    method: 'Same deposit timing',
    strategy: 'sameTiming',
  },
  {
    key: 'sp500_yearly',
    label: 'S&P 500 - start of year',
    asset: 'sp500',
    assetLabel: 'S&P 500',
    method: 'Start of year',
    strategy: 'yearly',
  },
  {
    key: 'nasdaq100_same_timing',
    label: 'NASDAQ - same timing',
    asset: 'nasdaq100',
    assetLabel: 'NASDAQ',
    method: 'Same deposit timing',
    strategy: 'sameTiming',
  },
  {
    key: 'nasdaq100_yearly',
    label: 'NASDAQ - start of year',
    asset: 'nasdaq100',
    assetLabel: 'NASDAQ',
    method: 'Start of year',
    strategy: 'yearly',
  },
  {
    key: 'bitcoin_same_timing',
    label: 'Bitcoin - same timing',
    asset: 'bitcoin',
    assetLabel: 'Bitcoin',
    method: 'Same deposit timing',
    strategy: 'sameTiming',
  },
  {
    key: 'bitcoin_yearly',
    label: 'Bitcoin - start of year',
    asset: 'bitcoin',
    assetLabel: 'Bitcoin',
    method: 'Start of year',
    strategy: 'yearly',
  },
]

const scenarios: PortfolioScenario[] = scenarioInputs.map(scenario => ({
  asset: scenario.assetLabel,
  key: scenario.key,
  label: scenario.label,
  method: scenario.method,
  result: calculatePortfolioWhatIf(
    scenario.asset,
    scenario.strategy,
    portfolioContributionPoints,
    portfolioEndPoint,
  ),
}))

const selectedScenarioKey = ref('')

const maxFinalPhp = Math.max(actualResult.finalPhp, ...scenarios.map(scenario => scenario.result.finalPhp))

const selectedScenario = computed(() => (
  scenarios.find(scenario => scenario.key === selectedScenarioKey.value)
))

const selectedBarWidth = computed(() => (
  selectedScenario.value
    ? Math.round((selectedScenario.value.result.finalPhp / maxFinalPhp) * 100)
    : 0
))
const actualBarWidth = computed(() => Math.round((actualResult.finalPhp / maxFinalPhp) * 100))

const differenceVsActual = computed(() => (selectedScenario.value?.result.finalPhp ?? actualResult.finalPhp) - actualResult.finalPhp)
const returnDifferenceVsActual = computed(() => (selectedScenario.value?.result.returnPct ?? actualResult.returnPct) - actualResult.returnPct)
const realisedShare = computed(() => Math.round((actualResult.realisedPhp / actualResult.totalReturnsPhp) * 100))
const unrealisedShare = computed(() => 100 - realisedShare.value)

const formatPhp = (value: number) => {
  if (Math.abs(value) >= 1000000)
    return `PHP ${(value / 1000000).toFixed(2)}M`
  return `PHP ${Math.round(value / 1000).toLocaleString()}K`
}

const formatSignedPhp = (value: number) => {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${formatPhp(Math.abs(value))}`
}

const formatPercent = (value: number) => `${Math.round(value)}%`

const formatSignedPercent = (value: number) => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${Math.round(value)}%`
}

const formatFx = (value: number) => value.toFixed(1)

const formatFxReturnImpact = (value: number) => {
  const rounded = Math.round(value)
  return `${rounded >= 0 ? '+' : ''}${rounded}% from FX`
}

const comparisonCopy = computed(() => {
  const direction = differenceVsActual.value >= 0 ? 'more than' : 'less than'
  return `${formatPhp(Math.abs(differenceVsActual.value))} ${direction} my actual picks, return is ${formatSignedPercent(returnDifferenceVsActual.value)} vs mine.`
})

const selectedFxCopy = computed(() => {
  if (!selectedScenario.value)
    return ''

  const fx = selectedScenario.value.result.fxImpact
  return `FX: buy conversion PHP ${formatFx(fx.effectiveEntryUsdPhp)}/USD -> ending PHP ${formatFx(fx.endingUsdPhp)}/USD = ${formatFxReturnImpact(fx.impactPctPoints)}`
})

const actualFxCopy = computed(() => {
  if (actualResult.fxImpactPctPoints === undefined)
    return 'Deposits use actual PHP paid, withdrawals use BSP PHP equivalents, and remaining USD value uses current FX.'

  return `Deposits use actual PHP paid. FX adds about ${formatFxReturnImpact(actualResult.fxImpactPctPoints)} versus USD-only scaling.`
})
</script>

<template>
  <div class="portfolio-result">
    <section class="portfolio-result__hero">
      <p>Actual result</p>
      <strong>{{ formatPhp(actualResult.finalPhp) }}</strong>
      <span>{{ formatPhp(actualResult.depositsPhp) }} deposits + {{ formatPhp(actualResult.totalReturnsPhp) }} returns</span>
      <small>{{ formatPercent(actualResult.returnPct) }} PHP return</small>
      <em>{{ actualFxCopy }}</em>
    </section>

    <section class="portfolio-result__split">
      <div>
        <p>Realised gains</p>
        <strong>{{ formatPhp(actualResult.realisedPhp) }}</strong>
        <small>{{ realisedShare }}% of returns</small>
      </div>
      <div>
        <p>Unrealised gains</p>
        <strong>{{ formatPhp(actualResult.unrealisedPhp) }}</strong>
        <small>{{ unrealisedShare }}% of returns</small>
      </div>
      <div class="portfolio-result__split-bar">
        <span :style="{ width: `${realisedShare}%` }" />
        <i :style="{ width: `${unrealisedShare}%` }" />
      </div>
    </section>

    <section class="portfolio-result__mini-card">
      <p>Already withdrawn</p>
      <strong>{{ formatPhp(actualResult.withdrawalsPhp) }}</strong>
      <small>Money already taken out.</small>
    </section>

    <section class="portfolio-result__mini-card">
      <p>Cash + equity left</p>
      <strong>{{ formatPhp(actualResult.cashEquityPhp) }}</strong>
      <small>Still visible in the account.</small>
    </section>

    <section class="portfolio-result__what-if">
      <label>
        <span>Compare with</span>
        <select v-model="selectedScenarioKey">
          <option disabled value="">Choose a comparison</option>
          <option
            v-for="scenario in scenarios"
            :key="scenario.key"
            :value="scenario.key"
          >
            {{ scenario.label }}
          </option>
        </select>
      </label>

      <div v-if="selectedScenario" class="portfolio-result__compare-summary">
        <p>{{ selectedScenario.method }}</p>
        <strong>{{ formatPhp(selectedScenario.result.finalPhp) }}</strong>
        <span>{{ formatPercent(selectedScenario.result.returnPct) }} return, {{ comparisonCopy }}</span>
        <small>{{ selectedFxCopy }}</small>
      </div>
      <div v-else class="portfolio-result__compare-summary portfolio-result__compare-summary--empty">
        <p>Optional comparison</p>
        <strong>Choose one</strong>
        <span>Pick a benchmark to replay the same money against another asset.</span>
      </div>

      <div v-if="selectedScenario" class="portfolio-result__bar-row">
        <p>{{ selectedScenario.label }}</p>
        <div><span :style="{ width: `${selectedBarWidth}%` }" /></div>
        <strong>{{ formatPhp(selectedScenario.result.finalPhp) }}</strong>
      </div>

      <div class="portfolio-result__bar-row">
        <p>My actual picks</p>
        <div><span :style="{ width: `${actualBarWidth}%` }" /></div>
        <strong>{{ formatPhp(actualResult.finalPhp) }}</strong>
      </div>
    </section>
  </div>
</template>

<style scoped>
.portfolio-result {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 0.58rem;
  margin-top: 0.55rem;
}

.portfolio-result__hero,
.portfolio-result__split,
.portfolio-result__mini-card,
.portfolio-result__what-if {
  border: 1px solid rgba(25, 0, 35, 0.18);
  border-radius: 1rem;
  padding: 0.68rem;
}

.portfolio-result p,
.portfolio-result small,
.portfolio-result em,
.portfolio-result label span,
.portfolio-result__compare-summary span {
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.28;
}

.portfolio-result p,
.portfolio-result small,
.portfolio-result em,
.portfolio-result label span {
  opacity: 0.72;
}

.portfolio-result__hero {
  display: grid;
  gap: 0.16rem;
  background: var(--oq-yellow);
  color: var(--oq-purple);
}

.portfolio-result__hero strong {
  font-size: 2.16rem;
  line-height: 1;
  font-weight: var(--oq-font-bold);
}

.portfolio-result__hero span {
  font-size: 0.88rem;
  line-height: 1.22;
}

.portfolio-result__hero em {
  max-width: 92%;
  font-size: 0.48rem;
  font-style: normal;
  line-height: 1.22;
  opacity: 0.62;
}

.portfolio-result__split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.portfolio-result__split strong,
.portfolio-result__mini-card strong,
.portfolio-result__compare-summary strong {
  display: block;
  margin-top: 0.12rem;
  font-size: 1.18rem;
  line-height: 1.08;
}

.portfolio-result__split-bar {
  grid-column: 1 / -1;
  display: flex;
  height: 0.62rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(25, 0, 35, 0.14);
}

.portfolio-result__split-bar span,
.portfolio-result__split-bar i {
  display: block;
  height: 100%;
}

.portfolio-result__split-bar span {
  background: currentColor;
}

.portfolio-result__split-bar i {
  background: var(--oq-yellow);
}

.portfolio-result__what-if {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(180px, 0.52fr) 1fr minmax(92px, auto);
  gap: 0.5rem 0.62rem;
  background: rgba(25, 0, 35, 0.04);
}

.portfolio-result__what-if label {
  display: grid;
  gap: 0.3rem;
  margin: 0;
}

.portfolio-result__what-if select {
  width: 100%;
  border: 1px solid rgba(25, 0, 35, 0.24);
  border-radius: 0.55rem;
  background: white;
  color: #190023;
  font: inherit;
  font-size: 0.78rem;
  padding: 0.32rem 0.42rem;
}

.portfolio-result__compare-summary {
  grid-column: 2 / -1;
  min-width: 0;
}

.portfolio-result__compare-summary--empty {
  align-self: center;
}

.portfolio-result__compare-summary strong {
  font-size: 1rem;
}

.portfolio-result__compare-summary span {
  display: block;
  margin-top: 0.16rem;
  opacity: 0.76;
}

.portfolio-result__compare-summary small {
  display: block;
  margin-top: 0.12rem;
  font-size: 0.5rem;
  line-height: 1.22;
  opacity: 0.52;
}

.portfolio-result__bar-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(180px, 0.52fr) 1fr minmax(92px, auto);
  gap: 0.62rem;
  align-items: center;
}

.portfolio-result__bar-row p,
.portfolio-result__bar-row strong {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.2;
}

.portfolio-result__bar-row strong {
  text-align: right;
}

.portfolio-result__bar-row div {
  height: 0.82rem;
  overflow: hidden;
  border: 1px solid currentColor;
  border-radius: 999px;
}

.portfolio-result__bar-row span {
  display: block;
  height: 100%;
  min-width: 0.4rem;
  background: currentColor;
}
</style>
