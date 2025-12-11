import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet'; 
import type { LatLngTuple } from 'leaflet'; 
import torinoGeo from '../assets/torino.geo.json'; 
import * as turf from "@turf/turf";
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { ReportStatus } from '../types/report'; 
import type { Location } from '../types/report'; 

export const getStatusColor = (status: string): string => {
    switch (status) {
        case ReportStatus.RESOLVED:
        return '#10b981'; // Green
        case ReportStatus.REJECTED:
        return '#ef4444'; // Red
        case ReportStatus.IN_PROGRESS:
        return '#3b82f6'; // Blue
        case ReportStatus.ASSIGNED:
        return '#3b82f6'; // Blue
        case ReportStatus.SUSPENDED:
        return '#f59e0b'; // Amber
        case ReportStatus.PENDING_APPROVAL:
        default:
        return '#6b7280'; // Gray
    }
};

export const getStatusClass = (status: string): string => {
  switch (status) {
    case ReportStatus.RESOLVED:
      return 'bg-green-100 text-green-700';

    case ReportStatus.REJECTED:
      return 'bg-red-100 text-red-700';

    case ReportStatus.IN_PROGRESS:
      return 'bg-blue-100 text-blue-700';

    case ReportStatus.ASSIGNED:
      return 'bg-blue-100 text-blue-700';

    case ReportStatus.SUSPENDED:
      return 'bg-amber-100 text-amber-700';

    case ReportStatus.PENDING_APPROVAL:
    default:
      return 'bg-gray-100 text-gray-700';
  }
};


const TORINO_CENTER: LatLngTuple = [45.0703, 7.6869];
const DEFAULT_ZOOM = 12;

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;



interface LocationMarkerProps { 
  onLocationSelect: (loc: Location | null) => void; 
  selectedLocation: Location | null;
  onBoundaryWarning: () => void;
}


const LocationMarker: React.FC<LocationMarkerProps> = ({ 
  onLocationSelect, 
  selectedLocation, 
  onBoundaryWarning 
}) => {

  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      const point = turf.point([lng, lat]);
      
      const geoObject = (torinoGeo as any)?.features
          ? (torinoGeo as any).features[0]
          : torinoGeo;
      const boundaryGeometry = (geoObject as any)?.geometry;
      let inside = false;

      if (boundaryGeometry) {
        inside = turf.booleanPointInPolygon(point, boundaryGeometry as any);
      }

      if (inside) {
        onLocationSelect({ lat, lng });
      } else {
        onBoundaryWarning();
        onLocationSelect(null);
      }
    },
  });

  return selectedLocation ? (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
  ) : null;
};


interface ReportsMapProps {
  reports: any[];
  currentPopUp: any; 
  setCurrentPopUp: (report: any | null) => void;
  hasSelect: boolean;
}
const ReportsMapContent: React.FC<ReportsMapProps> = ({ reports, currentPopUp, setCurrentPopUp, hasSelect = false }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [boundaryWarning, setBoundaryWarning] = useState(false);
  
  const handleLocationSelect = (loc: Location | null) => setSelectedLocation(loc);
  const handleBoundaryWarning = () => setBoundaryWarning(true);

  const map = useMap(); 
  React.useEffect(() => {
    if (currentPopUp) {
      map.closePopup(); 

      const layer = map.eachLayer((layer: any) => {
        if (layer.options && layer.options.className === `report_circle_${currentPopUp.id}`) {
          layer.openPopup();
          map.flyTo([currentPopUp.latitude, currentPopUp.longitude], map.getZoom()); 
        }
      });
    }
  }, [currentPopUp, map]);

  const boundaryLayers = useMemo(() => {
    const geo: any = torinoGeo as any;
    const holes: number[][][] = []

    const pushPolygonRings = (coords: any[]) => {
      coords.forEach((ring: any[]) => {
        holes.push(ring as number[][])
      })
    }
    
    if (geo.type === 'FeatureCollection') {
      geo.features.forEach((f: any) => {
        if (f.geometry.type === 'Polygon') pushPolygonRings(f.geometry.coordinates)
        if (f.geometry.type === 'MultiPolygon') f.geometry.coordinates.forEach((poly: any) => pushPolygonRings(poly))
      })
    } else if (geo.type === 'Feature') {
      if (geo.geometry.type === 'Polygon') pushPolygonRings(geo.geometry.coordinates)
      if (geo.geometry.type === 'MultiPolygon') geo.geometry.coordinates.forEach((poly: any) => pushPolygonRings(poly))
    } else if (geo.type === 'Polygon') {
      pushPolygonRings(geo.coordinates)
    } else if (geo.type === 'MultiPolygon') {
      geo.coordinates.forEach((poly: any) => pushPolygonRings(poly))
    }

    const outer = [[-195, -95], [195, -95], [195, 95], [-195, 95], [-195, -95]]

    const maskFeature: any = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [outer, ...holes]
      }
    }

    return (
      <>
        {/* Inverted mask: dark overlay outside Torino */}
        <GeoJSON data={maskFeature} style={{ color: 'transparent', weight: 0, fillColor: '#000000', fillOpacity: 0.25 }} />
        {/* Thin green border for allowed area */}
        <GeoJSON data={torinoGeo as any} style={{ color: 'green', weight: 2, fillOpacity: 0 }} />
      </>
    )
  }, []);
  // ----------------------------------------------------------------------

  return (
    <>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. Boundary Mask Layers */}
        {boundaryLayers}

        {/* 2. Marker for New Report Selection */}
        {hasSelect && (
            <LocationMarker
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                onBoundaryWarning={handleBoundaryWarning}
                />
        )}
        {/* 3. Markers for Existing Reports */}
        {reports
          .filter(report => report.latitude && report.longitude) 
          .map((report) => {
            const dotColor = getStatusColor(report.status);
            const mainPhoto = report.photos && report.photos.length > 0 ? report.photos[0] : null;

            return (
              <CircleMarker
                key={report.id}
                center={[report.latitude, report.longitude]} 
                radius={8}
                eventHandlers={{
                  click: () => {
                    setCurrentPopUp(report);
                  },
                  popupclose: () => {
                    setCurrentPopUp(null);
                  }
                }}
                pathOptions={{
                  className: `report_circle_${report.id}`,
                  color: 'white',
                  weight: 2,
                  fillColor: dotColor,
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div className="min-w-[240px] font-sans">

                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-2">
                        {report.title}
                    </h3>
                    <span 
                        className="text-xs font-semibold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: dotColor }}
                    >
                        {report.status}
                    </span>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                      {report.description}
                    </p>
                    {mainPhoto && (
                      <div className="mt-1">
                        <img
                          src={mainPhoto.photo_public_url}
                          alt="Evidence"
                          className="w-full h-20 object-cover rounded"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                        Reported by: {report.reporter?.username || 'Unknown'}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
        })}
    </>
  );
};


const ReportsMap: React.FC<ReportsMapProps> = (props) => {
    return (
        <MapContainer
            id="mapReport"
            center={TORINO_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={true}
            className="h-full w-full"
            minZoom={11}
        >
            <ReportsMapContent {...props} /> 
        </MapContainer>
    );
};

export default ReportsMap;