# Street-View Crime Analysis

**Analyzing crime patterns in London using environmental features and functional zones derived from street-view images**

An urban data science project examining how the physical built environment relates to crime, combining computer vision on **150,654** street-view images across Greater London with official crime statistics at the **LSOA (Lower Layer Super Output Area)** level.

**Live Dashboard**: [tian0t.github.io/street-view-crime-analysis/dashboard](https://tian0t.github.io/street-view-crime-analysis/dashboard/)

---

## Overview

Crime is shaped not only by socioeconomic factors but also by the physical design of urban space — visibility, surveillance, and land use all influence crime opportunities (Jacobs, 1961; CPTED). Most prior research reports citywide conclusions and overlooks how **the same environmental feature can have different effects under different urban contexts**: vegetation, for instance, may discourage crime in parks while providing concealment in dense commercial or industrial areas.

Street-view images were collected across Greater London via the **Mapillary API** on a **50 m sampling grid**, yielding 150,654 georeferenced images (150,653 successfully processed by both models below):

- **SegFormer-B0** (semantic segmentation, fine-tuned on Cityscapes) — pixel-level proportions of 19 urban elements (buildings, roads, vegetation, sky, vehicles, etc.).
- **Zero-shot CLIP classification** — a pretrained OpenCLIP model (ViT-B/32, LAION-2B) scores each image against 10 land-use prompts to infer its dominant function, following the zero-shot vision-language prompting approach of Huang, Wang and Cong (2024).

Features were aggregated to the LSOA level and merged with **Metropolitan Police Service crime records (2019–2025)** and **ONS population estimates**, producing crime rates per 1,000 residents alongside environmental and functional-zone indicators.

**Research questions:**
1. Do crime rates and composition differ across urban functional zones?
2. Which environmental features are significantly associated with different crime types?
3. Does the influence of environmental features vary across functional zones?

---

## Key Findings

**Crime composition is stable, but intensity varies by zone.** Theft has the highest mean annual rate across every functional zone (~0.61–0.69 per 1,000 residents), followed by burglary (~0.42–0.46) and drug offences (~0.31–0.34). Commercial and educational areas show the highest overall crime rates; industrial and outdoors/natural areas the lowest.

**Building density promotes crime; open sky suppresses it.** Building coverage correlates positively with theft (*r* = 0.24), robbery (*r* = 0.21), public disorder (*r* = 0.14), and burglary (*r* = 0.09, all *p* < 0.001). Sky visibility is negatively correlated with nearly all crime categories — most strongly with theft (*r* = −0.20) and, within zones, most strongly in commercial areas (*r* = −0.21) — consistent with CPTED's emphasis on natural surveillance.

**Environmental effects are context-dependent.** Vegetation shows only weak citywide associations (*r* = 0.07–0.09 with burglary and drug offences), but correlates far more strongly with total crime within **industrial zones** (*r* ≈ 0.34), while showing weak or near-zero relationships in transportation and outdoors/natural zones. Road coverage reverses similarly — positive in outdoors/natural and educational zones, flat or slightly negative elsewhere.

**Results are robust, though modest in explanatory power.** Pearson and Spearman correlations agree closely throughout, and Kruskal-Wallis tests confirm significant crime-rate differences across zones for all 8 crime types (p < 0.05). The merged dataset covers **72.9%** of London's LSOA boundaries (3,525 of 4,835) and **70.7%** of the crime-record base (3,525 of 4,988); excluded areas are concentrated on the city's fringes and along riverbanks. A standardized regression model of environmental features against crime rates (used to power the dashboard's scenario simulator) achieves a holdout R² of 0.02–0.06 depending on crime type — a useful directional tool, not a predictive one.

---

## Repository Structure

```text
Street-View-Crime-Analysis/
├── LSOA_data/                    # LSOA boundaries and population estimates
├── Processing data/              # Crime records, SegFormer & CLIP outputs
├── dashboard/                    # Interactive web dashboard (HTML/CSS/JS)
├── Part0_DataPrep_SVI.ipynb      # Grid generation, Mapillary retrieval, feature extraction
├── Part1_Main_Analysis.ipynb     # LSOA aggregation, correlation analysis, visualization
├── transit.ipynb                 # Supplementary transportation-zone analysis
├── Practical Briefing.docx       # Written report: methodology and findings
├── environment.yml               # Conda environment specification
└── README.md
```

Raw Mapillary images and large intermediates are excluded for storage and licensing reasons; the notebooks document the full workflow needed to regenerate them.

---

## Data & Models

| Data | Source |
|------|--------|
| LSOA boundaries | Greater London Authority |
| Population estimates | ONS |
| Crime incidents (LSOA level) | Metropolitan Police Service |
| Street-view imagery | Mapillary API (~150,000 images, 50 m grid) |

| Model | Task |
|------|------|
| SegFormer-B0 (`nvidia/segformer-b0-finetuned-cityscapes-1024-1024`) | Semantic segmentation → 19 environmental classes |
| OpenCLIP ViT-B/32 (`laion2b_s34b_b79k`), zero-shot prompted | Land-use classification → dominant functional zone |

**Stack:** Python · Pandas / NumPy / SciPy / Scikit-learn · GeoPandas / Shapely / Folium · PyTorch / Transformers / OpenCLIP · Matplotlib / Seaborn · Conda

---

## Getting Started

1. Clone the repository and install dependencies via `environment.yml` (or `geopandas`, `pandas`, `numpy`, `scipy`, `scikit-learn`, `matplotlib`, `seaborn`, `torch`, `transformers`, `open_clip`, `folium`).
2. Run `Part0_DataPrep_SVI.ipynb` to reproduce image collection, segmentation, and zero-shot classification. Requires a Mapillary API token in place of the notebook's placeholder.
3. Run `Part1_Main_Analysis.ipynb` to reproduce LSOA aggregation, crime processing, and correlation analysis.
4. To preview the dashboard locally: `cd dashboard && python3 -m http.server 8000`, then open `http://localhost:8000`.

---

## Methodology

- 50 m grid sampling across Greater London via Mapillary; nearest available image retained per grid point.
- SegFormer-B0 for pixel-level environmental features; zero-shot CLIP prompting across 10 land-use categories for functional zones.
- Features spatially joined to LSOA boundaries and aggregated as per-LSOA means; dominant function taken as the mode across each LSOA's images.
- Crime records (2019–2025) normalized per 1,000 residents using mean 2019–2022 ONS population.
- Pearson and Spearman correlations computed citywide and within each functional zone.
- Zones with fewer than 40 LSOAs excluded from zone-specific analysis, leaving six: residential, commercial, transportation, outdoors and natural, education, industrial.

---

## Limitations

- Mapillary coverage is uneven — major roads are better represented than residential or industrial streets.
- Images are forward-facing rather than panoramic, potentially missing environmental context outside the frame.
- Each LSOA is assigned a single dominant function, understating mixed land use.
- Functional-zone labels come from generic CLIP prompts rather than a model fine-tuned for urban scenes, so they are approximate.
- Findings are statistical associations, not causal relationships.

---

## Author

**Huaiyu Tian** — MSc Urban Data Science, University of Leeds
