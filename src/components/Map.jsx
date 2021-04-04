import React, { useEffect, useState } from "react";
import {
  TileLayer,
  LayerGroup,
  MapContainer,
  LayersControl,
  Marker,
  Popup
} from "react-leaflet";
import cities from "../data";

const Map = () => {
  const [map, setMap] = useState(null);
  const [maps, setMaps] = useState({
    base: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  });

  return (
    <>
      <MapContainer
        center={[38, -82]}
        zoom={4}
        zoomControl={false}
        style={{ height: "100vh", width: "100%", padding: 0 }}
        whenCreated={map => setMap(map)}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Map">
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url={maps.base}
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="Markers">
            <LayerGroup>
              {cities.map(city => (
                <Marker position={[city.lat, city.lng]}>
                  <Popup>{city.city}</Popup>
                </Marker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </>
  );
};

export default Map;
