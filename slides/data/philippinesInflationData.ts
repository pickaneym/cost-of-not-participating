export type PhilippinesInflationPoint = {
  isPartial?: boolean
  year: number
  inflationRate: number
}

export const philippinesInflationData: PhilippinesInflationPoint[] = [
  { year: 2015, inflationRate: 0.007 },
  { year: 2016, inflationRate: 0.013 },
  { year: 2017, inflationRate: 0.029 },
  { year: 2018, inflationRate: 0.052 },
  { year: 2019, inflationRate: 0.025 },
  { year: 2020, inflationRate: 0.026 },
  { year: 2021, inflationRate: 0.045 },
  { year: 2022, inflationRate: 0.058 },
  { year: 2023, inflationRate: 0.06 },
  { year: 2024, inflationRate: 0.032 },
  { year: 2025, inflationRate: 0.017 },
  { year: 2026, inflationRate: 0.039, isPartial: true },
]
