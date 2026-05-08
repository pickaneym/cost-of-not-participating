# Additional Asset Data Sources

Generated on: 2026-05-07

Matched monthly prices are in `data/asset_prices_bsp_selected_dates.csv`. Each asset is matched to the selected BSP USD/PHP date for that month. If the exact date has no market price, the nearest earlier trading day is used.

Assets:
- S&P 500: FRED `SP500`, source page https://fred.stlouisfed.org/series/SP500, matched rows 121.
- Nasdaq 100: FRED `NASDAQ100`, source page https://fred.stlouisfed.org/series/NASDAQ100, matched rows 121.
- Bitcoin: FRED `CBBTCUSD`, source page https://fred.stlouisfed.org/series/CBBTCUSD, matched rows 121.
- PSEI: Yahoo Finance chart data for `PSEI.PS`, source page https://finance.yahoo.com/quote/PSEI.PS/history, matched rows 121.
- Jollibee: Manual historical CSV download from `/Users/pickaneym/Downloads/JFC Historical Data.csv`, matched rows 121.
- Tesla: Yahoo Finance chart data for `TSLA`, source page https://finance.yahoo.com/quote/TSLA/history, matched rows 121.
- Apple: Yahoo Finance chart data for `AAPL`, source page https://finance.yahoo.com/quote/AAPL/history, matched rows 121.
- Microsoft: Yahoo Finance chart data for `MSFT`, source page https://finance.yahoo.com/quote/MSFT/history, matched rows 121.
- NVIDIA: Yahoo Finance chart data for `NVDA`, source page https://finance.yahoo.com/quote/NVDA/history, matched rows 121.
- Pag-IBIG MP2: Annual dividend rates in `data/pagibig_mp2_dividend_rates.csv`; this is rate data, not a daily traded price.

Important notes:
- Price-index assets and stock assets use close prices and exclude dividends, taxes, fees, spreads, and fund tracking costs.
- MP2 rates are historical annual dividend rates and are not guaranteed future rates.
- Jollibee and PSEI prices are PHP-denominated. US stocks, US indexes, and Bitcoin are USD-denominated.
