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
import Ellipse from './Ellipse'

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
          </LayersControl.BaseLayer><LayersControl.Overlay checked name='Ellipses'>
            <LayerGroup>
              {cities.map((city) => (
                <>
                  <Ellipse
                    center={[city.lat, city.lng]}
                    radii={[city.semimajor, city.semiminor]}
                    tilt={city.tilt}
                    options={city.options}
                    key={city.tilt}
                  >
                    <Popup key={city.lat}>This is quality popup content.</Popup>
                  </Ellipse>
                </>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </>
  );
};

export default Map;
