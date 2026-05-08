<script setup lang="ts">
type JourneyDeposit = {
  month: string
  amountK: number
  weight: number
}

type JourneyYear = {
  year: string
  isHeavy?: boolean
  deposits: JourneyDeposit[]
}

const years: JourneyYear[] = [
  {
    year: '2021',
    deposits: [
      { month: 'Sep', amountK: 8.3, weight: 29 },
      { month: 'Oct', amountK: 13.7, weight: 47 },
      { month: 'Nov', amountK: 8.3, weight: 29 },
      { month: 'Dec', amountK: 8.3, weight: 29 },
    ],
  },
  {
    year: '2022',
    isHeavy: true,
    deposits: [
      { month: 'Jan', amountK: 16.6, weight: 57 },
      { month: 'Mar', amountK: 29.1, weight: 100 },
      { month: 'May', amountK: 16.6, weight: 57 },
      { month: 'Jun', amountK: 17.0, weight: 59 },
      { month: 'Jul', amountK: 16.6, weight: 57 },
      { month: 'Aug', amountK: 16.6, weight: 57 },
    ],
  },
  {
    year: '2023',
    deposits: [
      { month: 'Mar', amountK: 1.7, weight: 6 },
      { month: 'Apr', amountK: 3.1, weight: 11 },
      { month: 'Jun', amountK: 8.3, weight: 29 },
      { month: 'Jul', amountK: 6.2, weight: 21 },
      { month: 'Aug', amountK: 8.3, weight: 29 },
      { month: 'Sep', amountK: 8.3, weight: 29 },
      { month: 'Oct', amountK: 8.3, weight: 29 },
      { month: 'Nov', amountK: 8.3, weight: 29 },
      { month: 'Dec', amountK: 8.3, weight: 29 },
    ],
  },
  {
    year: '2024',
    deposits: [
      { month: 'Jan', amountK: 8.3, weight: 29 },
      { month: 'Feb', amountK: 8.3, weight: 29 },
      { month: 'Mar', amountK: 8.3, weight: 29 },
      { month: 'Apr', amountK: 12.5, weight: 43 },
      { month: 'May', amountK: 12.5, weight: 43 },
      { month: 'Jul', amountK: 8.3, weight: 29 },
      { month: 'Sep', amountK: 16.6, weight: 57 },
    ],
  },
  {
    year: '2025',
    deposits: [
      { month: 'Sep', amountK: 13.3, weight: 46 },
    ],
  },
]
</script>

<template>
  <div class="oq-journey">
    <div class="oq-journey-years">
      <section
        v-for="year in years"
        :key="year.year"
        class="oq-journey-year"
        :class="{ 'oq-journey-year--heavy': year.isHeavy }"
      >
        <h3>{{ year.year }}</h3>
        <p
          v-for="deposit in year.deposits"
          :key="`${year.year}-${deposit.month}`"
        >
          <span>{{ deposit.month }}</span>
          <i :style="{ '--weight': `${deposit.weight}%` }" />
          <strong>PHP {{ deposit.amountK.toFixed(1) }}K</strong>
        </p>
      </section>
    </div>
  </div>
</template>
