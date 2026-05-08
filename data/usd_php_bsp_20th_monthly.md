# USD/PHP BSP 20th Monthly Data

Generated from the Bangko Sentral ng Pilipinas official exchange-rate workbook.

Source: https://www.bsp.gov.ph/statistics/external/pesodollar.xlsx
Source sheet: `daily`
Generated on: 2026-05-07
Range: 2016-05 to 2026-05
Rows: 121
Valid rows: 121
Exact 20th rows: 86
Fallback rows: 35
Missing rows: 0

Selection rule:
Use the BSP USD/PHP rate on the 20th of each month. If the 20th has no rate, use the nearest earlier BSP business day in the same month. If no earlier day exists, use the first available BSP rate in that month.

Columns:
- `month`: year-month bucket.
- `selected_date`: actual BSP daily rate date used.
- `target_day`: preferred day of month, always 20.
- `day_used`: day of month actually used.
- `usd_php`: Philippine pesos per 1 U.S. dollar.
- `selection`: whether the exact 20th or fallback rule was used.
- `source`: source workbook URL.
