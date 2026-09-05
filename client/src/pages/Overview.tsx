import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import KPICard from "../components/KPICard";
import PriorityBadge from "../components/PriorityBadge";

import reports from "../data/sif_classified_reports.json";
import patterns from "../data/precursor_patterns.json";
import priorities from "../data/hse_priorities.json";
import { useRef, useState } from "react";

import type {
  SafetyReport,
  PrecursorPattern,
  HSEPriorityItem,
  UploadedAnalysis,
} from "../types";


  const defaultSafetyReports =
    reports as SafetyReport[];

  const defaultPrecursorPatterns =
    patterns as PrecursorPattern[];

  const defaultHSEPriorities =
    priorities as HSEPriorityItem[];

    interface OverviewProps {
      uploadedAnalysis: UploadedAnalysis | null;
      onAnalysisComplete: (analysis: UploadedAnalysis) => void;
    }
  
export default function Overview({
  uploadedAnalysis,
  onAnalysisComplete,
}: OverviewProps) {

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
     const safetyReports =
    uploadedAnalysis?.reports ?? defaultSafetyReports;

    const precursorPatterns =
      uploadedAnalysis?.precursor_patterns ??
      defaultPrecursorPatterns;

    const hsePriorities =
      uploadedAnalysis?.hse_priorities ??
      defaultHSEPriorities;
    const allowedTypes = [
      ".pdf",
      ".csv",
      ".xlsx",
      ".xls",
    ];

  const handleFile = (file: File) => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(extension)) {
      alert("Please upload a PDF, CSV, XLSX or XLS file.");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };


  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setIsAnalyzing(true);

      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(
        "http://localhost:5000/api/reports/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail?.message ||
          "Failed to analyze report"
        );
      }

      const normalizedReports: SafetyReport[] =
        data.reports.map((report: any) => ({
          ...report,

          sif_classification: {
            sif_level:
              report.sif_classification?.sif_level ??
              "LOW",

            score:
              report.sif_classification?.score ??
              report.sif_classification?.sif_score ??
              0,
          },
        }));

      const analysis: UploadedAnalysis = {
        upload_id: data.upload_id,
        filename: data.filename,
        file_type: data.file_type,
        analyzed_at: data.analyzed_at,
        report_count: data.report_count,

        reports: normalizedReports,
        precursor_patterns: data.precursor_patterns,
        hse_priorities: data.hse_priorities,
      };

      onAnalysisComplete(analysis);

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail?.message ||
          "Failed to analyze report"
        );
      }

      console.log("Analysis completed:", data);

      console.log(
        "Reports:",
        data.reports
      );

      console.log(
        "Precursor Patterns:",
        data.precursor_patterns
      );

      console.log(
        "HSE Priorities:",
        data.hse_priorities
      );

      alert(
        `Analysis completed successfully!\n\n` +
        `Reports: ${data.report_count}\n` +
        `Precursor Patterns: ${data.precursor_count}\n` +
        `HSE Priorities: ${data.hse_priority_count}`
      );

      setShowUploadModal(false);
      setSelectedFile(null);

    } catch (error) {

      console.error(
        "Upload analysis failed:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to analyze report"
      );

    } finally {

      setIsAnalyzing(false);

    }
  };



  const high =
    safetyReports.filter(
      (report) =>
        report.sif_classification.sif_level ===
        "HIGH"
    ).length;

  const medium =
    safetyReports.filter(
      (report) =>
        report.sif_classification.sif_level ===
        "MEDIUM"
    ).length;

  const low =
    safetyReports.filter(
      (report) =>
        report.sif_classification.sif_level ===
        "LOW"
    ).length;


  const critical =
    hsePriorities.filter(
      (item) =>
        item.priority === "CRITICAL"
    ).length;


  const topPriority =
    hsePriorities[0];


  const chartData = [
  {
    name: "HIGH",
    value: high,
    fill: "#E53935",
  },
  {
    name: "MEDIUM",
    value: medium,
    fill: "#F5B82E",
  },
  {
    name: "LOW",
    value: low,
    fill: "#3F7FE5",
  },
];


  return (
    <div className="page-content">
      {/* UPLOAD REPORT */}

    <section className="panel" style={{ marginBottom: "20px" }}>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >

        <div>
          <h2 style={{ marginBottom: "6px" }}>
            Analyze a Safety Report
          </h2>

          <p>
            Upload a PDF, CSV or Excel report to generate
            SIF, Life-Saving Rule, precursor and HSE insights.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowUploadModal(true)}
        >
          📄 Upload Safety Report
        </button>

      </div>

    </section>
      {/* KPI SECTION */}

      <section className="kpi-grid">

        <KPICard
          label="Safety Reports"
          value={safetyReports.length}
          description="Reports analyzed"
          icon="▤"
        />

        <KPICard
          label="HIGH SIF"
          value={high}
          description="Requires attention"
          icon="⚠"
        />

        <KPICard
          label="Precursor Patterns"
          value={precursorPatterns.length}
          description="Patterns detected"
          icon="⌕"
        />

        <KPICard
          label="Critical HSE"
          value={critical}
          description="Priority interventions"
          icon="◆"
        />

      </section>


      {/* MAIN INSIGHT ROW */}

      <section className="dashboard-grid">

        {/* SIF CHART */}

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>
                SIF Potential Distribution
              </h2>

              <p>
                Current classification across analyzed reports
              </p>
            </div>

          </div>


          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={chartData}
                barCategoryGap="35%"
              >

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Bar
        dataKey="value"
        radius={[8, 8, 0, 0]}
        shape={(props) => (
          <Rectangle
            {...props}
            fill={props.payload?.fill}
          />
        )}
      />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* TOP PRIORITY */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Top HSE Priority
              </h2>

              <p>
                Highest-ranked precursor requiring attention
              </p>

            </div>

          </div>


          {topPriority && (

            <div className="priority-content">

              <PriorityBadge
                priority={
                  topPriority.priority
                }
              />


              <h3>
                {topPriority.activity}
              </h3>


              <p className="priority-hazard">
                {topPriority.hazard}
              </p>


              <div className="priority-metrics">

                <div>
                  <strong>
                    {topPriority.occurrence_count}
                  </strong>

                  <span>
                    Occurrences
                  </span>
                </div>

                <div>
                  <strong>
                    {topPriority.high_sif_count}
                  </strong>

                  <span>
                    HIGH SIF
                  </span>
                </div>

                </div>
                {/* <div>
                  <strong>
                    {topPriority.countries.length}
                  </strong>

                  <span>
                    Countries
                  </span>
                </div> */}



              <div className="recommendation">

                <div className="recommendation-label">
                  HSE Recommendation
                </div>

                <p>
                  {topPriority.recommendation}
                </p>

              </div>


              <button className="primary-button">
                View Priority →
              </button>

            </div>

          )}

        </div>

      </section>


      {/* PRECURSOR TABLE */}

      <section className="panel">

        <div className="panel-header">

          <div>

            <h2>
              Emerging SIF Precursor Patterns
            </h2>

            <p>
              Recurring safety patterns identified across reports
            </p>

          </div>

          <button className="text-button">
            View all →
          </button>

        </div>


        <div className="table-wrapper">

          <table>

            <thead>

              <tr>
          
                <th>
                  Activity
                </th>

                <th>
                  Hazard
                </th>

                {/* <th>
                  Life-Saving Rule
                </th> */}

                <th>
                  Occurrences
                </th>

                {/* <th>
                  Countries
                </th> */}

                <th>
                  Priority
                </th>

              </tr>

            </thead>


            <tbody>

              {precursorPatterns
                .slice(0, 6)
                .map((pattern) => (

                  <tr
                    key={pattern.pattern_id}
                  >

                    <td className="strong-cell">
                      {pattern.activity}
                    </td>

                    <td>
                      {pattern.hazard}
                    </td>

                    {/* <td>
                      {pattern.related_lsrs.join(
                        ", "
                      )}
                    </td> */}

                    <td>
                      {pattern.occurrence_count}
                    </td>

                    {/* <td>
                      {pattern.countries.length}
                    </td> */}

                    <td>

                      <PriorityBadge
                        priority={
                          pattern.priority
                        }
                      />

                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>

      </section>


      {/* INTERVENTION */}

      <section className="monitoring-banner">

        <div className="monitoring-icon">
          ↗
        </div>

        <div className="monitoring-text">

          <h3>
            Intervention Effectiveness Monitoring
          </h3>

          <p>
            Track recurring precursor patterns before
            and after HSE interventions.
          </p>

        </div>

        <button className="secondary-button">
          View Monitoring →
        </button>

      </section>
            {/* UPLOAD MODAL */}

      {showUploadModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowUploadModal(false)}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "620px",
              background: "#ffffff",
              borderRadius: "18px",
              padding: "28px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(event) => event.stopPropagation()}
          >

            {/* Modal Header */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "22px",
              }}
            >

              <div>
                <h2 style={{ marginBottom: "6px" }}>
                  Upload Safety Report
                </h2>

                <p>
                  Upload a report to start AI-assisted safety analysis.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                ✕
              </button>

            </div>


            {/* Drag & Drop Area */}

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => {
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging
                  ? "2px solid #16a34a"
                  : "2px dashed #cbd5e1",

                background: isDragging
                  ? "#f0fdf4"
                  : "#f8fafc",

                borderRadius: "14px",
                padding: "42px 24px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >

              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "12px",
                }}
              >
                📄
              </div>

              <h3
                style={{
                  marginBottom: "8px",
                  color: "#0f172a",
                }}
              >
                Drag & drop your report here
              </h3>

              <p
                style={{
                  marginBottom: "16px",
                  color: "#64748b",
                }}
              >
                or click to browse files
              </p>

              <span
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: "#ecfdf5",
                  color: "#15803d",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                PDF • CSV • XLSX • XLS
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.xlsx,.xls"
                style={{ display: "none" }}
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    handleFile(file);
                  }
                }}
              />

            </div>


            {/* Selected File */}

            {selectedFile && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >

                <div>
                  <strong
                    style={{
                      display: "block",
                      color: "#166534",
                      fontSize: "14px",
                    }}
                  >
                    ✓ {selectedFile.name}
                  </strong>

                  <span
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                <button
                  onClick={() => setSelectedFile(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>

              </div>
            )}


            {/* Modal Footer */}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "24px",
              }}
            >

              <button
                className="secondary-button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                }}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                disabled={!selectedFile}
                onClick={handleAnalyze}
                style={{
                  opacity: selectedFile ? 1 : 0.5,
                  cursor: selectedFile
                    ? "pointer"
                    : "not-allowed",
                }}
              >
                {isAnalyzing
                  ? "Analyzing..."
                  : "Analyze Report →"}
              </button>

            </div>

          </div>

        </div>
      )}          
    </div>
  );
}