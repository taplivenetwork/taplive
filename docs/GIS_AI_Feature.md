# Module 3: AI Weather + GIS Risk Advisor

## Overview

Module 3 upgrades traditional GIS and weather visualization into an **AI-driven decision support system**.  
The module interprets environmental and geographical data to assist users in making **risk-aware operational decisions**, rather than showing raw data.

This component functions as an **AI Risk Control Assistant**, aligning with the hackathon’s AI-first design focus.

---

## Objectives

- Transform GIS and weather data into AI-supported decision intelligence
- Shift GIS functionality from visualization to reasoning
- Use only free and open data sources
- Maintain AI reasoning as the core innovation

---

## Inputs

### User Inputs

- Location (city name or latitude/longitude)
- Task context (e.g., outdoor XR activity, drone operation, field coordination)
- Optional time window for assessment

---

## Data Sources (Free)

### GIS Data

- Provider: OpenStreetMap / Nominatim
- Purpose:
  - Resolve geographical location
  - Infer contextual attributes such as coastal, urban, or remote regions

### Weather Data

- Provider: Open-Meteo
- Cost: Free, no API key required
- Signals utilized:
  - Wind conditions
  - Precipitation levels
  - Visibility indicators
  - Short-term forecasts

---

## Architectural Design

### 1. GIS Context Layer

Processes raw location input and converts it into meaningful geographical context suitable for AI reasoning.

Responsibilities:

- Location resolution
- Regional context inference

---

### 2. Weather Data Layer

Collects and summarizes current and near-future weather conditions from free APIs.

Responsibilities:

- Weather signal aggregation
- Noise reduction and summarization

---

### 3. Context Builder

Normalizes all inputs into a unified, plain-language context for AI.

Responsibilities:

- Combine GIS, weather, task, and time inputs
- Prepare structured context for AI reasoning

---

### 4. AI Reasoning Layer

- Engine: Google Gemini API (Free Tier)
- Role:
  - Analyze environmental severity
  - Evaluate task sensitivity
  - Apply safety and risk reasoning
  - Determine an appropriate operational status

This layer replaces rule-based thresholds with contextual AI judgment.

---

### 5. Decision Layer

Produces structured decision outcomes:

- Operational status indicator
- Concise justification
- Recommended next action

Serves as the final decision interface for downstream systems or user display.

---

### 6. Presentation Layer

Minimal interface focusing on clarity:

- Highlight AI-derived decisions
- Avoid raw weather numbers
- Avoid complex visualizations
- Prioritize interpretability over UI complexity

---

## System Flow

```text
        ┌───────────────┐
        │  User Input   │
        └───────┬───────┘
                │
        ┌───────▼───────┐
        │ GIS Context   │
        │ Layer         │
        └───────┬───────┘
                │
        ┌───────▼───────┐
        │ Weather Data  │
        │ Layer         │
        └───────┬───────┘
                │
        ┌───────▼───────┐
        │ Context       │
        │ Builder       │
        └───────┬───────┘
                │
        ┌───────▼───────┐
        │ AI Reasoning  │
        │ Layer         │
        └───────┬───────┘
                │
        ┌───────▼───────┐
        │ Decision      │
        │ Layer         │
        └───────┬───────┘
                │
        ┌───────▼───────┐
        │ Presentation  │
        │ Layer         │
        └───────────────┘
```
