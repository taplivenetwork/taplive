# GIS Overview (Phase 2 — Public)

## Purpose
Enhance LBS-based matching, basic risk hints, and map visualizations while respecting privacy.

## Public Capabilities
- City/region-level geohints for order matching.
- Heatmap-style **aggregated** views (no precise personal tracking).
- Basic geofencing checks with privacy-first defaults.

## Privacy & Safety
- No raw GPS trails are exposed.
- Only aggregated, minimum-necessary location data is used in public outputs.
- Sensitive areas may trigger higher review requirements (principle-level only).

## Example Fields (Public)
```json
{
  "geo_hint": "city-level",
  "region_code": "US-CA",
  "fence_policy": "basic"
}
```
_Internal thresholds and detection rules are not public._
