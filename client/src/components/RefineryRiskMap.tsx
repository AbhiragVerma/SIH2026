import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

import refineryMap from "../data/refinery_map.json";

const refineryLocation: [number, number] = [
  refineryMap.refinery.latitude,
  refineryMap.refinery.longitude,
];

const zonePositions: Record<string, [number, number]> = {
  processing: [22.353, 69.837],
  storage: [22.348, 69.846],
  utilities: [22.355, 69.845],
  maintenance: [22.346, 69.837],
  loading: [22.343, 69.847],
};

const zoneRisk: Record<string, number> = {
  processing: 1.0,
  storage: 0.65,
  utilities: 0.3,
  maintenance: 0.85,
  loading: 0.75,
};

const zoneHazards: Record<string, string[]> = {
  processing: [
    "Stored energy",
    "Fire / explosion",
  ],
  storage: [
    "Lifting hazard",
    "Material handling",
  ],
  utilities: [
    "Electrical energy",
    "Stored energy",
  ],
  maintenance: [
    "Dropped object",
    "Lifting hazard",
  ],
  loading: [
    "Vehicle / road hazard",
    "Lifting hazard",
  ],
};

function HeatmapLayer() {
  const map = useMap();

  useEffect(() => {
    const points: [number, number, number][] = [];

    Object.entries(zonePositions).forEach(([zoneId, position]) => {
      const [lat, lng] = position;
      const risk = zoneRisk[zoneId];

      points.push(
        [lat, lng, risk],
        [lat + 0.002, lng, risk * 0.8],
        [lat - 0.002, lng, risk * 0.8],
        [lat, lng + 0.002, risk * 0.8],
        [lat, lng - 0.002, risk * 0.8],
        [lat + 0.0015, lng + 0.0015, risk * 0.7],
        [lat - 0.0015, lng - 0.0015, risk * 0.7],
      );
    });

    const heat = L.heatLayer(points, {
      radius: 55,
      blur: 45,
      maxZoom: 16,
      max: 1.0,
      minOpacity: 0.35,

      gradient: {
        0.2: "#22c55e",
        0.45: "#eab308",
        0.7: "#f97316",
        1.0: "#dc2626",
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map]);

  return null;
}

export default function RefineryRiskMap() {
  return (
    <div style={{ width: "100%", height: "500px" }}>
      <MapContainer
        center={refineryLocation}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <HeatmapLayer />

        {refineryMap.zones.map((zone) => {
          const position = zonePositions[zone.id];
          const hazards = zoneHazards[zone.id] || [];

          const labelIcon = L.divIcon({
            className: "",
            html: `
              <div style="
                background: rgba(20, 25, 30, 0.88);
                color: white;
                padding: 8px 11px;
                border-radius: 8px;
                font-size: 12px;
                line-height: 1.4;
                min-width: 150px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                border: 1px solid rgba(255,255,255,0.25);
              ">
                <div style="
                  font-weight: 700;
                  font-size: 13px;
                  margin-bottom: 4px;
                ">
                  ${zone.name}
                </div>

                <div style="
                  color: #facc15;
                  font-size: 11px;
                  margin-bottom: 3px;
                ">
                  ⚠ Key Hazards
                </div>

                ${hazards
                  .map(
                    (hazard) =>
                      `<div style="font-size: 11px;">• ${hazard}</div>`
                  )
                  .join("")}
              </div>
            `,
            iconSize: undefined,
          });

          return (
            <Marker
              key={zone.id}
              position={position}
              icon={labelIcon}
            >
              <Popup>
                <strong>{zone.name}</strong>

                <br />
                <br />

                <strong>Key Hazards</strong>

                <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                  {hazards.map((hazard) => (
                    <li key={hazard}>{hazard}</li>
                  ))}
                </ul>
              </Popup>
            </Marker>
          );
        })}

        <Marker position={refineryLocation}>
          <Popup>
            <strong>Reliance Jamnagar Refinery Complex</strong>
            <br />
            Jamnagar, Gujarat
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}