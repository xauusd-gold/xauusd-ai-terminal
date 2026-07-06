# Feriha Intelligence

## Publish

1. Copy these files to the repository root and push.
2. Regenerate the exposed Twelve Data key, then add the new key in GitHub Actions secrets as `TWELVE_DATA_API_KEY`.
3. Run the `Update live economic calendar` workflow once.
4. Enable GitHub Pages from `main` and `/ (root)`.

The calendar uses Forex Factory's free public weekly export; no calendar key is required. The workflow merges each refresh into the current month and updates Twelve Data XAU/USD price every two hours. All displayed times use India Standard Time (`Asia/Kolkata`). Never put the private API key in public HTML. LONG/SHORT is scenario analysis, not a prediction.

