<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  assetOptions,
  mp2DividendRates,
  pesoMarketData,
  type CalculatorAssetKey,
} from '../data/pesoMarketData'
import { philippinesInflationData } from '../data/philippinesInflationData'
import { calculateInvestmentScenario, calculateSavingsValue } from '../utils/investmentCalculator'

const annualBudget = ref(30000)
const years = ref(1)
const savingsRate = ref(1)
const asset = ref<CalculatorAssetKey | ''>('')

const selectedOption = computed(() => (
  assetOptions.find(option => option.key === asset.value)
))

const scenario = computed(() => {
  if (!asset.value)
    return undefined

  return calculateInvestmentScenario({
    annualBudget: annualBudget.value,
    asset: asset.value,
    marketData: pesoMarketData,
    mp2DividendRates,
    savingsRate: savingsRate.value,
    years: years.value,
  })
})

const maxYears = computed(() => scenario.value?.maxYears ?? 10)

watch(maxYears, (value) => {
  if (years.value > value)
    years.value = value
}, { immediate: true })

const startPoint = computed(() => scenario.value?.startPoint)
const endPoint = computed(() => scenario.value?.endPoint)
const monthlyBudget = computed(() => scenario.value?.monthlyBudget ?? annualBudget.value / 12)
const totalContributed = computed(() => scenario.value?.totalContributed ?? annualBudget.value * years.value)
const lumpSumValue = computed(() => scenario.value?.yearlyValue ?? 0)
const monthlyValue = computed(() => scenario.value?.monthlyValue ?? 0)
const savingsPoints = computed(() => {
  const endIndexExclusive = pesoMarketData.length - 1
  const startIndex = Math.max(0, endIndexExclusive - years.value * 12)

  return pesoMarketData.slice(startIndex, endIndexExclusive)
})
const savingsValue = computed(() => scenario.value?.savingsValue ?? calculateSavingsValue(
  savingsPoints.value,
  annualBudget.value,
  savingsRate.value,
))
const fxImpact = computed(() => scenario.value?.fxImpact)

const formatPhp = (value: number) => {
  if (value >= 1000000)
    return `PHP ${(value / 1000000).toFixed(value >= 10000000 ? 1 : 2)}M`
  if (value >= 1000)
    return `PHP ${Math.round(value / 1000).toLocaleString()}K`
  return `PHP ${Math.round(value).toLocaleString()}`
}

const formatPercent = (value: number) => (
  `${Math.round(((value / totalContributed.value) - 1) * 100)}%`
)

const formatRoundedPercent = (value: number) => `${Math.round(value)}%`
const formatRate = (value: number) => value.toFixed(1).replace(/\.0$/, '')

const formatFx = (value: number) => value.toFixed(1)
const formatFxReturnImpact = (value: number) => {
  const rounded = Math.round(value)
  return `${rounded >= 0 ? '+' : ''}${rounded}% from FX`
}

const yearlyTooltip = computed(() => {
  if (asset.value === 'mp2')
    return 'Adds the full annual budget at the start of each year. MP2 dividends are added yearly using the average balance for that calendar year.'

  return 'Adds the full annual budget at the first available month of each year, buys the selected asset, then values all units at the latest price.'
})

const monthlyTooltip = computed(() => {
  if (asset.value === 'mp2')
    return 'Adds one-twelfth of the annual budget every month. MP2 dividends are added yearly using the average balance for that calendar year.'

  return 'Adds one-twelfth of the annual budget every month, buys the selected asset monthly, then values all units at the latest price.'
})

const savingsTooltip = computed(() => (
  'Adds the full annual budget at the start of each year. Interest uses the selected gross yearly rate converted monthly, then reduced by 20% tax.'
))

const investmentCards = computed(() => scenario.value ? [
  {
    label: asset.value === 'mp2' ? 'MP2 yearly deposits' : `Invest yearly in ${selectedOption.value?.label}`,
    value: lumpSumValue.value,
    detail: `${formatPhp(annualBudget.value)} at the start of each year`,
    tooltip: yearlyTooltip.value,
    fxNote: fxImpact.value
      ? `FX: ${formatFx(fxImpact.value.yearly.effectiveEntryUsdPhp)} -> ${formatFx(fxImpact.value.yearly.endingUsdPhp)} = ${formatFxReturnImpact(fxImpact.value.yearly.impactPctPoints)}`
      : undefined,
    accent: true,
  },
  {
    label: asset.value === 'mp2' ? 'MP2 monthly deposits' : `Invest monthly in ${selectedOption.value?.label}`,
    value: monthlyValue.value,
    detail: asset.value === 'mp2' ? `${formatPhp(monthlyBudget.value)} at the start of each month, yearly dividends reinvested` : `${formatPhp(monthlyBudget.value)} at the start of each month`,
    tooltip: monthlyTooltip.value,
    fxNote: fxImpact.value
      ? `FX: ${formatFx(fxImpact.value.monthly.effectiveEntryUsdPhp)} -> ${formatFx(fxImpact.value.monthly.endingUsdPhp)} = ${formatFxReturnImpact(fxImpact.value.monthly.impactPctPoints)}`
      : undefined,
    accent: false,
  },
] : [])

const savingsCard = computed(() => ({
  label: 'Keep in savings',
  value: savingsValue.value,
  detail: `${formatPhp(annualBudget.value)} at the start of each year, ${formatRate(savingsRate.value)}% gross yearly`,
  tooltip: savingsTooltip.value,
  fxNote: undefined,
  accent: false,
}))

const resultCards = computed(() => [
  ...investmentCards.value,
  {
    ...savingsCard.value,
    accent: !scenario.value,
  },
])

const inflationContext = computed(() => {
  const fallbackStartPoint = savingsPoints.value[0]
  const fallbackEndPoint = pesoMarketData[pesoMarketData.length - 1]
  const startYear = Number((startPoint.value?.month ?? fallbackStartPoint?.month).slice(0, 4))
  const endYear = Number((endPoint.value?.month ?? fallbackEndPoint.month).slice(0, 4))
  const selectedYears = philippinesInflationData.filter(point => (
    point.year >= startYear && point.year <= endYear
  ))
  const cumulativeInflation = selectedYears.reduce(
    (value, point) => value * (1 + point.inflationRate),
    1,
  ) - 1
  const hasPartialYear = selectedYears.some(point => point.isPartial)
  const inflationAdjustedBudget = totalContributed.value * (1 + cumulativeInflation)

  return {
    cumulativeInflation,
    endYear,
    hasPartialYear,
    inflationAdjustedBudget,
    startYear,
  }
})
</script>

<template>
  <div class="peso-calculator">
    <section class="peso-calculator__controls">
      <label>
        <span>Annual budget</span>
        <input
          v-model.number="annualBudget"
          type="number"
          min="12000"
          step="12000"
        >
      </label>

      <div class="peso-calculator__quick-buttons">
        <button type="button" @click="annualBudget = 60000">PHP 60K</button>
        <button type="button" @click="annualBudget = 120000">PHP 120K</button>
        <button type="button" @click="annualBudget = 180000">PHP 180K</button>
      </div>

      <label>
        <span>Years</span>
        <input
          v-model.number="years"
          type="range"
          min="1"
          :max="maxYears"
          step="1"
        >
        <strong>{{ years }} years</strong>
      </label>

      <label>
        <span>Asset</span>
        <select v-model="asset">
          <option disabled value="">Choose an asset</option>
          <option
            v-for="option in assetOptions"
            :key="option.key"
            :value="option.key"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label>
        <span>Savings rate</span>
        <input
          v-model.number="savingsRate"
          type="range"
          min="0"
          max="5"
          step="0.1"
        >
        <strong>{{ formatRate(savingsRate) }}% per year, before tax</strong>
      </label>
    </section>

    <section class="peso-calculator__results">
      <p class="peso-calculator__summary">
        <template v-if="scenario && startPoint && endPoint">
          Setting aside <strong>{{ formatPhp(totalContributed) }}</strong>
          from {{ startPoint.month }} to {{ endPoint.month }}:
        </template>
        <template v-else>
          Setting aside <strong>{{ formatPhp(totalContributed) }}</strong>
          for {{ years }} years:
        </template>
      </p>

      <div class="peso-calculator__cards">
        <article
          v-for="card in resultCards"
          :key="card.label"
          class="peso-calculator__card"
          :class="{ 'peso-calculator__card--accent': card.accent }"
        >
          <header>
            <p>{{ card.label }}</p>
            <button
              type="button"
              aria-label="Show computation explanation"
            >
              ?
              <span>{{ card.tooltip }}</span>
            </button>
          </header>
          <strong>{{ formatPhp(card.value) }}</strong>
          <span>{{ formatPercent(card.value) }} total return</span>
          <small>{{ card.detail }}</small>
          <em v-if="card.fxNote">{{ card.fxNote }}</em>
        </article>
      </div>

      <p class="peso-calculator__inflation-note">
        Inflation: BSP/PSA CPI rose about
        <strong>{{ formatRoundedPercent(inflationContext.cumulativeInflation * 100) }}</strong>
        from {{ inflationContext.startYear }}-{{ inflationContext.endYear }}{{ inflationContext.hasPartialYear ? ' YTD' : '' }};
        {{ formatPhp(totalContributed) }} would need about
        {{ formatPhp(inflationContext.inflationAdjustedBudget) }} today.
      </p>

    </section>
  </div>
</template>

<style scoped>
.peso-calculator {
  display: grid;
  grid-template-columns: minmax(210px, 0.34fr) 1fr;
  gap: 1rem;
  margin-top: 0.8rem;
}

.peso-calculator__controls,
.peso-calculator__results {
  border: 1px solid rgba(25, 0, 35, 0.18);
  border-radius: 1rem;
  padding: 0.9rem;
}

.peso-calculator__controls {
  display: grid;
  gap: 0.72rem;
  background: rgba(25, 0, 35, 0.04);
}

.peso-calculator__controls label {
  display: grid;
  gap: 0.34rem;
  margin: 0;
}

.peso-calculator__controls span,
.peso-calculator__card p,
.peso-calculator__card small,
.peso-calculator__card em {
  font-size: 0.72rem;
  line-height: 1.35;
}

.peso-calculator__controls span,
.peso-calculator__card p {
  opacity: 0.72;
}

.peso-calculator__controls input,
.peso-calculator__controls select {
  width: 100%;
  border: 1px solid rgba(25, 0, 35, 0.24);
  border-radius: 0.52rem;
  background: white;
  color: #190023;
  font: inherit;
  font-size: 0.82rem;
  padding: 0.34rem 0.42rem;
}

.peso-calculator__controls input[type="range"] {
  padding: 0;
}

.peso-calculator__controls strong {
  font-size: 0.78rem;
}

.peso-calculator__quick-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.32rem;
}

.peso-calculator__quick-buttons button {
  border: 1px solid rgba(25, 0, 35, 0.24);
  border-radius: 999px;
  background: white;
  color: #190023;
  font: inherit;
  font-size: 0.68rem;
  padding: 0.28rem 0.2rem;
}

.peso-calculator__summary {
  margin: 0 0 0.72rem;
  font-size: 0.98rem;
  line-height: 1.35;
}

.peso-calculator__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.56rem;
}

.peso-calculator__inflation-note {
  margin: 0.44rem 0 0;
  border-top: 1px solid rgba(25, 0, 35, 0.12);
  padding: 0.36rem 0.12rem 0;
  font-size: 0.6rem !important;
  line-height: 1.22;
  opacity: 0.38;
}

.peso-calculator__inflation-note strong {
  font-weight: var(--oq-font-bold);
}

.peso-calculator__card {
  min-height: 8.6rem;
  border: 1px solid rgba(25, 0, 35, 0.2);
  border-radius: 0.9rem;
  padding: 0.72rem;
}

.peso-calculator__card--accent {
  background: #f0f55f;
  border-color: #f0f55f;
}

.peso-calculator__card p,
.peso-calculator__card small,
.peso-calculator__card em {
  margin: 0;
}

.peso-calculator__card header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.3rem;
  align-items: start;
}

.peso-calculator__card button {
  position: relative;
  display: grid;
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: transparent;
  color: rgba(25, 0, 35, 0.62);
  font: inherit;
  font-size: 0.56rem;
  line-height: 1;
}

.peso-calculator__card button span {
  position: absolute;
  right: -0.2rem;
  bottom: calc(100% + 0.35rem);
  z-index: 2;
  display: none;
  width: 11.5rem;
  padding: 0.42rem 0.48rem;
  border: 1px solid rgba(25, 0, 35, 0.18);
  border-radius: 0.48rem;
  background: #fff;
  box-shadow: 0 0.4rem 1.2rem rgba(25, 0, 35, 0.16);
  color: #190023;
  font-size: 0.52rem;
  font-weight: 400;
  line-height: 1.25;
  text-align: left;
}

.peso-calculator__card button:hover span,
.peso-calculator__card button:focus-visible span {
  display: block;
}

.peso-calculator__card strong {
  display: block;
  margin-top: 0.3rem;
  font-size: 1.36rem;
  line-height: 1.05;
}

.peso-calculator__card span {
  display: block;
  margin-top: 0.24rem;
  font-size: 0.76rem;
  font-weight: 700;
}

.peso-calculator__card small {
  display: block;
  margin-top: 0.42rem;
  opacity: 0.68;
}

.peso-calculator__card em {
  display: block;
  margin-top: 0.36rem;
  font-size: 0.48rem;
  font-style: normal;
  line-height: 1.28;
  opacity: 0.52;
}

</style>
