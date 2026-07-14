const data = window.ANALYSIS_SUMMARY;

// DOM Elements
const anchorNav = document.getElementById("anchorNav");
const metaCards = document.getElementById("metaCards");
const findingCards = document.getElementById("findingCards");
const methodSelect = document.getElementById("methodSelect");
const crimeSelect = document.getElementById("crimeSelect");
const chartNote = document.getElementById("chartNote");
const timeSeriesSelect = document.getElementById("timeSeriesSelect");
const zoneCards = document.getElementById("zoneCards");
const qualityList = document.getElementById("qualityList");
const zoneCrimeSelect = document.getElementById("zoneCrimeSelect");
const bubbleCrimeSelect = document.getElementById("bubbleCrimeSelect");
const simTargetSelect = document.getElementById("simTargetSelect");
const simControls = document.getElementById("simControls");
const simResult = document.getElementById("simResult");
const simPresets = document.getElementById("simPresets");
const mapModeSelect = document.getElementById("mapModeSelect");
const coverageToggle = document.getElementById("coverageToggle");
const mapLegend = document.getElementById("mapLegend");

// Plotly Configuration
const plotCfg = { displayModeBar: 'hover', responsive: true };
const plotLayout = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "rgba(255, 255, 255, 0.75)", family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif", size: 12 },
  margin: { l: 80, r: 40, t: 40, b: 60 },
  xaxis: {
    gridcolor: "rgba(255, 255, 255, 0.05)",
    zerolinecolor: "rgba(255, 255, 255, 0.1)",
    tickfont: { color: "rgba(255,255,255,0.6)" }
  },
  yaxis: {
    gridcolor: "rgba(255, 255, 255, 0.05)",
    zerolinecolor: "rgba(255, 255, 255, 0.1)",
    tickfont: { color: "rgba(255,255,255,0.6)" }
  },
};

// Utilities
function formatPct(v, digits = 2) {
  return `${(v * 100).toFixed(digits)}%`;
}

function fillSelect(selectEl, list) {
  if (!selectEl) return;
  if (!list?.length) {
    selectEl.innerHTML = "";
    return;
  }
  if (typeof list[0] === "string") {
    selectEl.innerHTML = list.map((item) => `<option value="${item}">${item}</option>`).join("");
  } else {
    selectEl.innerHTML = list.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
  }
}

function prettyCrime(name) {
  return String(name)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

// Navigation setup
function initNav() {
  if (!anchorNav) return;
  const nav = [
    ["overview", "Overview"],
    ["methodology", "Methodology"],
    ["insights", "Findings"],
    ["explorer", "Correlations"],
    ["timeline", "Trends"],
    ["support-heatmap", "Diagnostics"],
    ["map", "Map"],
    ["zones", "Zones"],
    ["zone-crime", "Profiles"],
    ["evidence", "Evidence"],
    ["simulator", "Simulator"],
    ["quality", "Quality"],
  ];
  anchorNav.innerHTML = nav.map(([id, name]) => `<a href="#${id}" role="menuitem">${name}</a>`).join("");
}

// Render data
function renderMeta() {
  if (!metaCards || !data?.meta) return;
  const m = data.meta;
  const cards = [
    ["Merged LSOAs", `${m.lsoa_merged}`],
    ["Crime-Base LSOAs", `${m.lsoa_total_crime_base}`],
    ["Coverage Ratio", formatPct(m.coverage_ratio)],
    ["Matched Images", `${m.unique_images.toLocaleString()}`],
    ["Grid Centroids", `${m.grid_points_matched.toLocaleString()}`],
    ["Feature Dimensions", `${m.feature_count}`],
  ];
  metaCards.innerHTML = cards.map(([label, value]) => `
    <article class="metric-card">
      <p>${label}</p>
      <h4>${value}</h4>
    </article>
  `).join("");
}

function renderFindings() {
  if (!findingCards || !data?.top_findings) return;
  const p = data.top_findings.pearson_theft_positive || { feature: "N/A", value: 0, p: 1 };
  const n = data.top_findings.pearson_theft_negative || { feature: "N/A", value: 0, p: 1 };
  const tier = data.evidence_tiers || {};
  const cards = [
    { title: "Strongest Positive Link (Theft)", desc: `Feature: <strong>${p.feature}</strong><br/>Pearson r: <strong>${p.value.toFixed(3)}</strong> (p=${p.p.toExponential(2)})` },
    { title: "Strongest Negative Link (Theft)", desc: `Feature: <strong>${n.feature}</strong><br/>Pearson r: <strong>${n.value.toFixed(3)}</strong> (p=${n.p.toExponential(2)})` },
    { title: "Evidence Strength Tiers", desc: `Robust Associations:<br/>Strong: <strong>${tier.strong ?? 0}</strong> · Moderate: <strong>${tier.moderate ?? 0}</strong>` },
  ];
  findingCards.innerHTML = cards.map((x, i) => `
    <article class="question-card">
      <p class="question-index">0${i + 1}</p>
      <h4>${x.title}</h4>
      <p>${x.desc}</p>
    </article>
  `).join("");
}

function updateCorrelationChart() {
  if (!methodSelect || !crimeSelect || !document.getElementById("corrChart")) return;
  const method = methodSelect.value;
  const crime = crimeSelect.value;
  const rows = data.correlations[method][crime].slice(0, 14);
  const x = rows.map((r) => r.value).reverse();
  const y = rows.map((r) => r.feature).reverse();
  
  // Custom color scale for positive vs negative correlation
  const colors = x.map((v) => (v >= 0 ? "rgba(255, 149, 0, 0.85)" : "rgba(52, 199, 89, 0.85)"));
  
  Plotly.react("corrChart", [{
    type: "bar",
    orientation: "h",
    x, y,
    marker: { color: colors, line: { width: 1, color: "rgba(255,255,255,0.2)" } },
    customdata: rows.map((r) => [r.p, r.n]).reverse(),
    hovertemplate: "<b>%{y}</b><br>Correlation: %{x:.3f}<br>p-value: %{customdata[0]:.2e}<br>Sample Size: %{customdata[1]}<extra></extra>",
  }], {
    ...plotLayout,
    xaxis: { ...plotLayout.xaxis, title: "Correlation Coefficient" },
    yaxis: { ...plotLayout.yaxis, title: "" },
  }, plotCfg);
  
  const strongest = rows[0];
  if (chartNote && strongest) {
    chartNote.textContent = `Strongest environmental correlate for ${prettyCrime(crime)} (${method}): ${strongest.feature} (${strongest.value.toFixed(3)}, p=${strongest.p.toExponential(2)})`;
  }
}

function updateTimeChart() {
  if (!timeSeriesSelect || !document.getElementById("timeChart")) return;
  const key = timeSeriesSelect.value;
  const isGranular = document.getElementById("timeResolutionToggle")?.checked;
  const showYoY = document.getElementById("timeYoYToggle")?.checked;
  const yoyToggle = document.getElementById("timeYoYToggle");
  const yoyLabel = document.getElementById("yoyToggleLabel");
  let effectiveShowYoY = showYoY;

  if (yoyToggle && yoyLabel) {
    if (isGranular || key !== "TOTAL") {
      yoyLabel.style.display = "none";
      yoyToggle.checked = false;
      effectiveShowYoY = false;
    } else {
      yoyLabel.style.display = "flex";
    }
  }

  const traces = [];

  if (isGranular && key === "TOTAL") {
    // Render high-res monthly series (unused field monthly_total)
    const series = data.time_series.monthly_total;
    const x = series.map((d) => {
      const yr = d.month.substring(0, 4);
      const mo = d.month.substring(4, 6);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(mo) - 1]} ${yr}`;
    });
    const y = series.map((d) => d.value);

    traces.push({
      name: "Monthly Count",
      type: "scatter",
      mode: "lines",
      x, y,
      line: { color: "#007aff", width: 2, shape: "spline" },
      hovertemplate: "%{x}<br>Crime Volume: %{y:,.0f}<extra></extra>",
    });
  } else {
    // Render annual series
    const series = key === "TOTAL" ? data.time_series.total : data.time_series.categories[key];
    const x = series.map((d) => d.year);
    const y = series.map((d) => d.value);

    traces.push({
      name: "Annual Count",
      type: "scatter",
      mode: "lines+markers",
      x, y,
      line: { color: key === "TOTAL" ? "#007aff" : "#ff9500", width: 3, shape: "linear" },
      marker: { size: 8, color: "#fff", line: { width: 2, color: (key === "TOTAL" ? "#007aff" : "#ff9500") } },
      hovertemplate: "Year %{x}<br>Volume: %{y:,.0f}<extra></extra>",
    });

    // Add Year-over-Year Growth Rate overlay as secondary bar chart (unused field yoy)
    if (effectiveShowYoY && key === "TOTAL") {
      // Exclude partial years (e.g. a year with fewer than 12 months of data) —
      // otherwise they'd render as a misleading 0% bar or a false swing.
      const yoyData = data.time_series.yoy.filter(d => !d.partial && d.change_pct !== null);
      traces.push({
        name: "YoY Growth",
        type: "bar",
        x: yoyData.map(d => d.year),
        y: yoyData.map(d => d.change_pct * 100),
        yaxis: "y2",
        marker: {
          color: yoyData.map(d => d.change_pct >= 0 ? "rgba(255, 59, 48, 0.4)" : "rgba(52, 199, 89, 0.4)"),
          line: { width: 1, color: "rgba(255,255,255,0.15)" }
        },
        hovertemplate: "YoY Change: %{y:+.2f}%<extra></extra>"
      });
    }
  }

  // Define layout with potential secondary y-axis
  const layout = {
    ...plotLayout,
    xaxis: { ...plotLayout.xaxis, title: isGranular ? "Month" : "Year" },
    yaxis: { ...plotLayout.yaxis, title: "Crime Incidents Count" },
    legend: { orientation: "h", y: -0.2, font: { color: "rgba(255,255,255,0.5)" } }
  };

  if (effectiveShowYoY && !isGranular && key === "TOTAL") {
    layout.yaxis2 = {
      title: "YoY % Change",
      titlefont: { color: "rgba(255,255,255,0.4)" },
      tickfont: { color: "rgba(255,255,255,0.4)" },
      overlaying: "y",
      side: "right",
      gridcolor: "rgba(255,255,255,0.02)",
      zerolinecolor: "rgba(255,255,255,0.15)",
    };
  }

  Plotly.react("timeChart", traces, layout, plotCfg);
}

function renderSeasonality() {
  if (!document.getElementById("seasonalityChart")) return;
  const s = data.time_series.seasonality;
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  Plotly.react("seasonalityChart", [{
    type: "heatmap",
    z: s.matrix,
    x: monthLabels,
    y: s.years,
    colorscale: "Viridis",
    colorbar: { title: "Crimes", tickfont: { color: "rgba(255,255,255,0.5)" } },
    hovertemplate: "Year %{y}, %{x}<br>Crime Volume: %{z:,.0f}<extra></extra>",
  }], {
    ...plotLayout,
    xaxis: { ...plotLayout.xaxis, title: "" },
    yaxis: { ...plotLayout.yaxis, title: "Year" },
  }, plotCfg);
}

function renderCorrelationHeatmap() {
  if (!document.getElementById("corrHeatmap")) return;
  const h = data.corr_heatmap;
  Plotly.react("corrHeatmap", [{
    type: "heatmap",
    z: h.matrix,
    x: h.crimes.map(c => prettyCrime(c)),
    y: h.features,
    colorscale: "RdBu",
    reversescale: true,
    zmin: -0.3,
    zmax: 0.3,
    colorbar: { tickfont: { color: "rgba(255,255,255,0.5)" } },
    hovertemplate: "Feature %{y}<br>Crime %{x}<br>r = %{z:.3f}<extra></extra>",
  }], {
    ...plotLayout,
    xaxis: { ...plotLayout.xaxis, tickangle: -25 },
    yaxis: { ...plotLayout.yaxis },
    margin: { l: 100, r: 20, t: 40, b: 80 }
  }, plotCfg);
}

function renderFeatureCorrMatrix() {
  if (!document.getElementById("featureCorrChart")) return;
  const m = data.feature_corr_matrix;
  Plotly.react("featureCorrChart", [{
    type: "heatmap",
    z: m.matrix,
    x: m.features,
    y: m.features,
    colorscale: "RdBu",
    reversescale: true,
    zmin: -1, zmax: 1,
    colorbar: { tickfont: { color: "rgba(255,255,255,0.5)" } },
    hovertemplate: "%{y} × %{x}<br>Correlation: %{z:.2f}<extra></extra>",
  }], {
    ...plotLayout,
    xaxis: { ...plotLayout.xaxis, tickangle: -30 },
    yaxis: { ...plotLayout.yaxis },
    margin: { l: 100, r: 20, t: 40, b: 80 }
  }, plotCfg);
}

function renderZones() {
  if (!zoneCards) return;
  zoneCards.innerHTML = data.zone_cards.map((z) => {
    const chips = z.top_crime_mix.map((x) => `<span>${prettyCrime(x.crime)}: ${x.value.toFixed(2)}</span>`).join("");
    // Leverage the relative_total_index field to show relative crime rate vs London avg
    const ratioText = z.relative_total_index >= 1.0 
      ? `<strong class="text-highlight">+${((z.relative_total_index - 1)*100).toFixed(0)}%</strong> vs city avg` 
      : `<strong class="text-highlight">-${((1 - z.relative_total_index)*100).toFixed(0)}%</strong> vs city avg`;
      
    return `
      <article class="zone-card">
        <h4>${z.name}</h4>
        <p>LSOAs: <strong>${z.sample_size}</strong> · Mean Total Crime: <strong>${z.mean_total_crime.toFixed(2)}</strong></p>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin: 0.5rem 0;">Crime Rate Index: ${ratioText}</p>
        <div class="chip-row">${chips}</div>
      </article>
    `;
  }).join("");
}

function renderDistribution() {
  if (!document.getElementById("distChart")) return;
  const rows = data.function_distribution.slice(0, 10);
  Plotly.react("distChart", [{
    type: "bar",
    x: rows.map((r) => r.function),
    y: rows.map((r) => r.count),
    marker: { color: "#007aff", opacity: 0.8, line: {width: 1, color: "rgba(255,255,255,0.2)"} },
    hovertemplate: "%{x}<br>LSOAs: %{y}<extra></extra>",
  }], {
    ...plotLayout,
    xaxis: { ...plotLayout.xaxis, title: "Functional Zone", tickangle: -25 },
    yaxis: { ...plotLayout.yaxis, title: "LSOA Count" },
    margin: { l: 60, r: 20, t: 40, b: 80 }
  }, plotCfg);
}

function updateZoneCrimeChart() {
  if (!zoneCrimeSelect || !document.getElementById("zoneCrimeChart")) return;
  const c = zoneCrimeSelect.value;
  const z = data.zone_crime_stats;
  const x = z.map((r) => r.function);
  const mean = z.map((r) => r[c].mean);
  const q25 = z.map((r) => r[c].q25);
  const q75 = z.map((r) => r[c].q75);
  
  Plotly.react("zoneCrimeChart", [{
    type: "bar",
    x, y: mean,
    marker: { color: "#ff9500", opacity: 0.85, line: {width:1, color:"rgba(255,255,255,0.2)"} },
    error_y: {
      type: "data", symmetric: false,
      array: q75.map((v, i) => Math.max(v - mean[i], 0)),
      arrayminus: q25.map((v, i) => Math.max(mean[i] - v, 0)),
      color: "rgba(255,255,255,0.5)",
      thickness: 1.5,
    },
    hovertemplate: "Zone: %{x}<br>Mean Crime Rate: %{y:.3f} per 1000<extra></extra>",
  }], {
    ...plotLayout,
    xaxis: { ...plotLayout.xaxis, tickangle: -20 },
    yaxis: { ...plotLayout.yaxis, title: `${prettyCrime(c)} per 1000 residents` },
    margin: { l: 60, r: 20, t: 40, b: 80 }
  }, plotCfg);
}

function updateEvidenceChart() {
  if (!bubbleCrimeSelect || !document.getElementById("evidenceChart")) return;
  const crime = bubbleCrimeSelect.value;
  const rows = data.evidence_bubble.filter((r) => r.crime === crime);
  
  // Use absolute correlation to define bubble size for better data-density visual
  const maxAbsCorr = Math.max(...rows.map(r => Math.abs(r.corr)), 0.1);
  const sizes = rows.map(r => (Math.abs(r.corr) / maxAbsCorr) * 20 + 8);

  Plotly.react("evidenceChart", [{
    type: "scatter",
    mode: "markers+text",
    x: rows.map((r) => r.corr),
    y: rows.map((r) => r.sig),
    text: rows.map((r) => r.feature),
    textposition: "top center",
    marker: {
      size: sizes,
      color: rows.map((r) => (r.corr >= 0 ? "rgba(255, 149, 0, 0.8)" : "rgba(52, 199, 89, 0.8)")),
      opacity: 0.8,
      line: { width: 1.5, color: "#fff" },
    },
    textfont: {color: "rgba(255,255,255,0.85)", size: 10},
    hovertemplate: "Feature: <b>%{text}</b><br>Correlation: %{x:.3f}<br>-log10(p): %{y:.2f}<br>LSOAs: %{marker.size}<extra></extra>",
  }], {
    ...plotLayout,
    xaxis: { ...plotLayout.xaxis, title: "Pearson Correlation Coefficient", zeroline: true },
    yaxis: { ...plotLayout.yaxis, title: "Statistical Significance: -log10(p-value)" },
    shapes: [
      // Dotted lines representing significance thresholds (p < 0.05 is ~1.30, p < 0.01 is 2.00)
      { type: "line", x0: -0.4, x1: 0.4, y0: 1.301, y1: 1.301, line: { color: "rgba(255,255,255,0.25)", width: 1, dash: "dash" } },
      { type: "line", x0: -0.4, x1: 0.4, y0: 2, y1: 2, line: { color: "rgba(255, 255, 255, 0.4)", width: 1, dash: "dot" } }
    ],
  }, plotCfg);
}

function renderZoneTests() {
  if (!document.getElementById("zoneTestChart")) return;
  const rows = data.zone_tests || [];
  const y = rows.map((r) => prettyCrime(r.crime));
  const x = rows.map((r) => (r.p == null ? 0 : -Math.log10(Math.max(r.p, 1e-300))));
  const hVals = rows.map((r) => r.H ?? 0);
  
  Plotly.react("zoneTestChart", [{
    type: "bar",
    orientation: "h",
    x: x.slice().reverse(),
    y: y.slice().reverse(),
    customdata: hVals.slice().reverse(),
    marker: { color: "rgba(191, 90, 242, 0.8)", line:{width:1, color:"rgba(255,255,255,0.2)"} },
    hovertemplate: "%{y}<br>-log10(p): %{x:.2f}<br>Kruskal H: %{customdata:.2f}<extra></extra>",
  }], {
    ...plotLayout,
    xaxis: { ...plotLayout.xaxis, title: "Significance: -log10(p-value)" },
    yaxis: { ...plotLayout.yaxis },
    margin: { l: 150, r: 20, t: 40, b: 60 },
    shapes: [
      { type: "line", x0: 1.301, x1: 1.301, y0: -0.5, y1: y.length - 0.5, line: { dash: "dot", color: "#ff9500" } },
      { type: "line", x0: 2, x1: 2, y0: -0.5, y1: y.length - 0.5, line: { dash: "dot", color: "#34c759" } },
    ],
  }, plotCfg);
}

function setupSimulator() {
  if (!simTargetSelect || !simPresets || !simControls || !simResult) return;
  const models = data.scenario_models || {};
  const available = Object.keys(models).filter((k) => models[k]);
  if (!available.length) return;
  
  fillSelect(simTargetSelect, available.map((k) => ({ value: k, label: prettyCrime(k) })));
  const presets = [
    { key: "baseline", label: "Baseline" },
    { key: "safety", label: "Safety Boost" },
    { key: "risk", label: "Risk Stress" },
  ];
  simPresets.innerHTML = presets.map((p) => `<button class="sim-preset-btn" data-preset="${p.key}">${p.label}</button>`).join("");

  function renderControls(target) {
    const model = models[target];
    simControls.innerHTML = model.features.map((f, i) => `
      <div class="sim-card">
        <div class="sim-row">
          <label>${f.feature}</label>
          <span class="sim-val" id="simv_${i}">${f.mean.toFixed(3)}</span>
          <div class="sim-range-wrap">
            <input type="range" id="sim_${i}" min="${f.q10}" max="${f.q90}" step="${Math.max((f.q90 - f.q10) / 180, 0.0001)}" value="${f.mean}" />
            <div class="sim-range-meta">
              <span>Q10 ${f.q10.toFixed(3)}</span>
              <span>Q90 ${f.q90.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  }

  function computePrediction(target, draw = true) {
    const model = models[target];
    let zsum = 0;
    const contrib = [];
    model.features.forEach((f, i) => {
      const el = document.getElementById(`sim_${i}`);
      const v = parseFloat(el.value);
      document.getElementById(`simv_${i}`).textContent = v.toFixed(3);
      const z = (v - f.mean) / (f.std || 1);
      const impact = f.beta_std * z;
      zsum += impact;
      contrib.push({ feature: f.feature, impact });
    });
    const pred = model.y_mean + model.y_std * zsum;
    const delta = pred - model.y_mean;
    const ratio = model.y_mean === 0 ? 0 : delta / model.y_mean;

    // Display scenario prediction along with newly loaded academic parameters (Holdout R-squared and sample size n)
    simResult.innerHTML = `
      <div class="sim-metrics-header" style="width:100%; display:flex; justify-content:space-between; margin-bottom:0.75rem; font-size:0.85rem; color:var(--text-secondary);">
        <span>Holdout R²: <strong>${(model.r2_test ?? 0).toFixed(3)}</strong> (Train R²: ${(model.r2_train ?? 0).toFixed(3)})</span>
        <span>Sample Size: <strong>n = ${model.n} LSOAs</strong></span>
      </div>
      <span class="sim-chip">Baseline: ${model.y_mean.toFixed(3)}</span>
      <span class="sim-chip">Scenario: ${pred.toFixed(3)}</span>
      <span class="sim-chip" style="color: ${delta >= 0 ? 'var(--warning)' : 'var(--positive)'}">Delta: ${delta >= 0 ? "+" : ""}${delta.toFixed(3)} (${(ratio * 100).toFixed(2)}%)</span>
    `;

    if (!draw || !document.getElementById("simChart")) return;
    const sorted = contrib.slice().sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    Plotly.react("simChart", [
      {
        type: "indicator",
        mode: "gauge+number+delta",
        value: pred,
        delta: { reference: model.y_mean, increasing: { color: "#ff3b30" }, decreasing: { color: "#34c759" } },
        gauge: {
          axis: { range: [Math.max(0, model.y_mean * 0.55), model.y_mean * 1.45] },
          bar: { color: "#007aff" },
          bgcolor: "rgba(255,255,255,0.05)",
          bordercolor: "rgba(255,255,255,0.2)",
        },
        domain: { x: [0, 0.38], y: [0, 1] },
        title: { text: prettyCrime(target), font: { color: "rgba(255,255,255,0.85)", size: 14 } },
      },
      {
        type: "bar",
        orientation: "h",
        x: sorted.map((d) => d.impact).reverse(),
        y: sorted.map((d) => d.feature).reverse(),
        marker: { color: sorted.map((d) => (d.impact >= 0 ? "#ff9500" : "#34c759")).reverse() },
        xaxis: "x2", yaxis: "y2",
        hovertemplate: "%{y}<br>Standardized Impact: %{x:.3f}<extra></extra>",
      },
    ], {
      ...plotLayout,
      margin: { l: 80, r: 20, t: 32, b: 36 },
      xaxis2: { domain: [0.46, 1], title: "Standardized Coeff Impact", ...plotLayout.xaxis },
      yaxis2: { domain: [0, 1], title: "", ...plotLayout.yaxis },
    }, plotCfg);
  }

  function applyPreset(target, preset) {
    const model = models[target];
    model.features.forEach((f, i) => {
      const el = document.getElementById(`sim_${i}`);
      if (!el) return;
      if (preset === "baseline") el.value = f.mean;
      else if (preset === "safety") el.value = f.beta_std >= 0 ? f.q10 : f.q90;
      else if (preset === "risk") el.value = f.beta_std >= 0 ? f.q90 : f.q10;
    });
    computePrediction(target);
  }

  function refresh() {
    const target = simTargetSelect.value;
    renderControls(target);
    const model = models[target]; // Fixed implicit global variable
    model.features.forEach((_, i) => {
      document.getElementById(`sim_${i}`).addEventListener("input", () => computePrediction(target));
    });
    computePrediction(target);
    simPresets.querySelectorAll("button").forEach((b) => {
      b.onclick = () => applyPreset(target, b.dataset.preset);
    });
  }

  simTargetSelect.addEventListener("change", refresh);
  refresh();
}

function renderQuality() {
  if (!qualityList) return;
  qualityList.innerHTML = data.quality_notes
    .map((q) => {
      let badge = "Note";
      let parsedText = q;

      if (q.includes("Usable merged LSOAs")) {
        badge = "Data Scope";
        parsedText = q.replace("3525 / 4988", "<span class='text-highlight'>3525 / 4988</span>")
                      .replace("70.67%", "<span class='text-highlight'>70.67%</span>");
      } else if (q.includes("Functional-zone")) {
        badge = "Sampling Bias";
        parsedText = q.replace("Residential and Commercial dominate", "<span class='text-highlight'>Residential & Commercial dominate</span>");
      } else if (q.includes("correlational")) {
        badge = "Causality";
        parsedText = q.replace("correlational", "<span class='text-highlight'>correlational (non-causal)</span>");
      } else if (q.includes("linear model")) {
        badge = "Model Quality";
        parsedText = q.replace(/R²=([\d\.]+)/g, "R² = <span class='text-highlight'>$1</span>");
      } else if (q.includes("Average holdout R²")) {
        badge = "Generalization";
        parsedText = q.replace(/R² across scenario targets: ([\d\.]+)/g, "R² across scenario targets: <span class='text-highlight'>$1</span>");
      } else if (q.includes("Zone-difference")) {
        badge = "Significance";
        parsedText = q.replace("8/8 crime types reach p<0.05", "<span class='text-highlight'>8/8 crime types reach p&lt;0.05</span>");
      }

      return `
        <article class="limit-item">
          <div class="limit-header">
            <span class="limit-badge">${badge}</span>
          </div>
          <p>${parsedText}</p>
        </article>
      `;
    })
    .join("");
}

function initMap() {
  if (!window.L || !window.MAP_PAYLOAD || !document.getElementById("mapCanvas")) return;
  const payload = window.MAP_PAYLOAD;
  const map = L.map("mapCanvas", { zoomControl: true }).setView([51.5072, -0.12], 10);
  
  // Use CARTO DB Dark Matter tiles
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  const q = payload.crime_quantiles || [3.2, 3.6, 4.0, 4.6];
  const crimeColors = ["#1d3a5b", "#245c7a", "#2f8a8f", "#64b07a", "#ff9500"];
  const fnPalette = {
    residential: "#34c759",
    commercial: "#ff9500",
    transportation: "#007aff",
    "outdoors and natural": "#32d74b",
    education: "#bf5af2",
    industrial: "#8e8e93",
    "health care": "#ff3b30",
    "sports and recreation": "#64d2ff",
    hotel: "#ffd60a",
    "civil and governmental": "#ff2d55",
    unknown: "#48484a",
  };

  function colorByCrime(v) {
    if (v == null || Number.isNaN(v)) return "rgba(255,255,255,0.05)";
    if (v <= q[0]) return crimeColors[0];
    if (v <= q[1]) return crimeColors[1];
    if (v <= q[2]) return crimeColors[2];
    if (v <= q[3]) return crimeColors[3];
    return crimeColors[4];
  }

  function renderLegend(mode) {
    if (!mapLegend) return;
    let items = [];
    if (mode === "crime") {
      items = [
        [crimeColors[0], `≤ ${q[0].toFixed(2)}`],
        [crimeColors[1], `${q[0].toFixed(2)} - ${q[1].toFixed(2)}`],
        [crimeColors[2], `${q[1].toFixed(2)} - ${q[2].toFixed(2)}`],
        [crimeColors[3], `${q[2].toFixed(2)} - ${q[3].toFixed(2)}`],
        [crimeColors[4], `> ${q[3].toFixed(2)}`],
      ];
    } else if (mode === "coverage") {
      items = [["#007aff", "Has merged data"], ["rgba(255,255,255,0.05)", "No merged data"]];
    } else {
      items = Object.entries(fnPalette).map(([k, v]) => [v, k]);
    }
    mapLegend.innerHTML = items.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join("");
  }

  const lsoaLayer = L.geoJSON(payload.geojson, {
    style: (f) => {
      const p = f.properties || {};
      const mode = mapModeSelect.value;
      const fillColor = mode === "crime" ? colorByCrime(p.total_crime) :
                        mode === "coverage" ? (p.has_data ? "#007aff" : "rgba(255,255,255,0.05)") :
                        fnPalette[String(p.predicted_function || "unknown").toLowerCase()] || fnPalette.unknown;
      return { color: "rgba(255,255,255,0.1)", weight: 0.5, fillColor, fillOpacity: p.has_data ? 0.7 : 0.2 };
    },
    onEachFeature: (feature, layer) => {
      const p = feature.properties || {};
      layer.bindPopup(`
        <div style="font-family: var(--font-family); color: #fff;">
          <b>${p.LSOA11NM || "LSOA"}</b><br/>
          Function: ${p.predicted_function || "N/A"}<br/>
          Total crime rate: ${p.total_crime == null ? "N/A" : Number(p.total_crime).toFixed(3)}
        </div>
      `);
    },
  }).addTo(map);

  const pts = payload.coverage_points || [];
  const coverageLayer = L.layerGroup(pts.map((pt) =>
    L.circleMarker([pt[1], pt[0]], { radius: 1, stroke: false, fillColor: "rgba(255,255,255,0.5)", fillOpacity: 0.5 })
  ));
  coverageLayer.addTo(map);
  map.fitBounds(lsoaLayer.getBounds(), { padding: [10, 10] });

  function refreshMapMode() {
    lsoaLayer.setStyle(lsoaLayer.options.style);
    renderLegend(mapModeSelect.value);
  }

  function refreshCoverage() {
    coverageToggle.checked ? coverageLayer.addTo(map) : coverageLayer.remove();
  }

  mapModeSelect.addEventListener("change", refreshMapMode);
  coverageToggle.addEventListener("change", refreshCoverage);
  renderLegend("crime");
}

// Dropdown Logic
function initDropdowns() {
  const btns = document.querySelectorAll('.info-btn');
  const dropdowns = document.querySelectorAll('.t-dropdown');
  const duration = 150; // matches --dropdown-close-dur

  function closeDropdown(d) {
    if (d.classList.contains('is-open')) {
      d.classList.remove('is-open');
      d.classList.add('is-closing');
      setTimeout(() => {
        d.classList.remove('is-closing');
      }, duration);
    }
  }

  function closeAllDropdowns(exceptId) {
    dropdowns.forEach(d => {
      if (d.id !== exceptId) closeDropdown(d);
    });
  }

  btns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.dataset.target;
      const d = document.getElementById(targetId);
      if (!d) return;

      if (d.classList.contains('is-open')) {
        closeDropdown(d);
      } else {
        closeAllDropdowns(targetId); // Corrected argument pass
        d.classList.remove('is-closing');
        // Force reflow before adding is-open so the transition triggers
        void d.offsetWidth; 
        d.classList.add('is-open');
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.t-dropdown') && !e.target.closest('.info-btn')) {
      closeAllDropdowns();
    }
  });

  // Keyboard support for accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
    }
  });
}

// Scroll Reveals using Intersection Observer
function initScrollReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.chapter').forEach(el => observer.observe(el));
}

// Boot sequence
function boot() {
  if (!data) {
    console.error("ANALYSIS_SUMMARY data not loaded.");
    return;
  }
  
  initNav();
  renderMeta();
  renderFindings();
  renderZones();
  renderDistribution();
  renderCorrelationHeatmap();
  renderSeasonality();
  renderFeatureCorrMatrix();
  renderZoneTests();
  renderQuality();

  fillSelect(methodSelect, data.method_options);
  fillSelect(crimeSelect, data.crime_options.map((k) => ({ value: k, label: prettyCrime(k) })));
  fillSelect(zoneCrimeSelect, data.crime_options.map((k) => ({ value: k, label: prettyCrime(k) })));
  fillSelect(bubbleCrimeSelect, data.crime_options.map((k) => ({ value: k, label: prettyCrime(k) })));
  fillSelect(timeSeriesSelect, ["TOTAL", ...Object.keys(data.time_series.categories)]);

  methodSelect?.addEventListener("change", updateCorrelationChart);
  crimeSelect?.addEventListener("change", updateCorrelationChart);
  zoneCrimeSelect?.addEventListener("change", updateZoneCrimeChart);
  bubbleCrimeSelect?.addEventListener("change", updateEvidenceChart);
  
  timeSeriesSelect?.addEventListener("change", updateTimeChart);
  document.getElementById("timeResolutionToggle")?.addEventListener("change", updateTimeChart);
  document.getElementById("timeYoYToggle")?.addEventListener("change", updateTimeChart);

  updateCorrelationChart();
  updateTimeChart();
  updateZoneCrimeChart();
  updateEvidenceChart();
  setupSimulator();
  initMap();
  initScrollReveals();
  initDropdowns();
}

window.addEventListener('DOMContentLoaded', boot);
