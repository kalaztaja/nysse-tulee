import React from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  ScaleControl,
  Polygon,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LineLayer } from "./lineLayer";
import { useEffect, useRef, useState } from "react";
import { LatLngExpression, Map as LeafletMap } from "leaflet";
import { TramLayer } from "./tramLayer";

const MapComponent = () => {
  const [pos, setPos] = useState<LatLngExpression>([0, 0]);

  return (
    <MapContainer
      center={[61.47911, 23.78712]}
      zoom={12.5}
      zoomSnap={0.25}
      attributionControl={false}
      className="h-screen w-screen"
      zoomControl={false}
      keyboard={false}
    >
      <ZoomControl position="topright" />
      <ScaleControl position="bottomleft" imperial={false} />
      <TileLayer
        className="h-screen w-screen"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <div className="absolute z-[500] top-5 left-5 "></div>
      <LineLayer />
      <TramLayer />
    </MapContainer>
  );
};

export default MapComponent;
