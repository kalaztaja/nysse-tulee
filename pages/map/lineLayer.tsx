import { GeoJSON } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import { GeoJSON as LeafletGeoJSON } from "leaflet";
import { thirdLine } from "../../data/thirdLine";
import { Feature } from "geojson";
import { fetchTrams } from "../../api/requests";
import { LiveTram } from "../../models/liveTram";
import L from "leaflet";

export const LineLayer = () => {
  const geoJsonLayerRef = useRef<LeafletGeoJSON | null>(null);
  const [geoData] = useState<any>({
    type: "Feature",
    properties: null,
  });
  useEffect(() => {
    const layer = geoJsonLayerRef.current;
    if (layer) {
      layer.clearLayers();
      layer.addData(thirdLine);
      return;
    }
  }, []);
  return <GeoJSON data={geoData} ref={geoJsonLayerRef} />;
};
