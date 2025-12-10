import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, {type LatLngTuple } from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import torinoGeo from '../assets/torino.geo.json';
import * as turf from "@turf/turf";
import { useMemo } from 'react';

import { reportAPI } from '../api/reports';
import type { ReportCategory } from '../types/report';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import FileInput from '../components/FileInput';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const TORINO_CENTER: LatLngTuple = [45.0703, 7.6869];

interface Location {
  lat: number;
  lng: number;
}

const LocationMarker: React.FC<{ 
  onLocationSelect: (loc: Location | null) => void; 
  selectedLocation: Location | null;
  onBoundaryWarning: () => void;
}> = ({ onLocationSelect, selectedLocation, onBoundaryWarning }) => {
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
            // boundaryGeometry can be Polygon/MultiPolygon Feature or raw geometry from the geojson file.
            // Use `any` here to satisfy the turf runtime which accepts GeoJSON polygons; strict typing
            // would require mapping Geometry -> Feature<Polygon|MultiPolygon>.
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

const MapPage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photos, setPhotos] = useState<File[] | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formWarning, setFormWarning] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [boundaryWarning, setBoundaryWarning] = useState(false);

  // When this component is mounted for the first time, call the server api for loading the report categories
  useEffect(() => {
    reportAPI.getReportCategories()
      .then((repCategories: ReportCategory[]) => {
        setCategories(repCategories);
      }).catch(error => {
        setFormError('Could not fetch report categories: ' + error.message);
        console.log('Could not fetch report categories: ' + error);
      });
  }, []);

  const handleLocationSelect = (loc: Location | null) => {
    setSelectedLocation(loc);
    setIsFormVisible(loc !== null);
  };

  const handleCloseForm = () => {
    setSelectedLocation(null);
    setIsFormVisible(false);
    setDescription('');
    setTitle('');
    setCategoryId(0);
    setIsAnonymous(false);
    setPhotos(null);
  };

  const validateReport = (): Boolean => {
    let error = ''
    if (selectedLocation == null) error = 'Please select a location on the map first'
    else if (title == '') error = 'Report title cannot be empty';
    else if (description == '') error = 'Report description cannot be empty';
    else if (categoryId == 0) error = 'Please select a report category';
    else if (photos == null) error = 'Please provide at least one photo';

    setFormWarning(error);
    return error == '';
  }

  // const handleFileChange = (e: any) => {
  //   if (e.target.files && e.target.files.length > 3) {
  //     setFormWarning('You can select a maximum of 3 photos.');
  //     e.target.value = '';
  //     setPhotos(null);
  //     return;
  //   }
  //   setFormWarning('');
  //   setPhotos(e.target.files);
  // };
  // Example Handler using the recommended File[] type
  const handleFileChange = (files: File[]) => {
    setPhotos(files);
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReport()) {
      return;
    }

    const formData = new FormData();
    // Note: All non-file fields must be appended as strings/numbers
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category_id', categoryId.toString());
    formData.append('latitude', selectedLocation!.lat.toString());
    formData.append('longitude', selectedLocation!.lng.toString());
    formData.append('is_public', (!isAnonymous).toString());

    if (photos)
      for (let i = 0; i < photos.length; i++)
        formData.append('photos', photos[i]);

    console.log('Report to send:', formData);
    reportAPI.createReport(formData).then(savedReport => {
      console.log(savedReport);
      // Reset form after successful submission
      setFormSuccessMessage('Report sent successfully!');
      handleCloseForm();

    }).catch(err => {
      setFormError('Failed to create report: ' + err.message);
      console.log(err);
    });
  };

  return (
    <>
      {/* Boundary warning modal - shows when user clicks outside Turin */}
      <Modal
        isOpen={boundaryWarning}
        onClose={() => setBoundaryWarning(false)}
        title={'Invalid Location'}
        message={'Location must be inside the city of Torino!'}
        type={'warning'}
      />
      {/* Warning modal - only shows up when the formWarning state is not empty */}
      <Modal
        isOpen={formWarning !== ''}
        onClose={() => setFormWarning('')}
        title={'Warning'}
        message={formWarning}
        type={'warning'}
      />
      {/* Error modal - only shows up when the formError state is not empty */}
      <Modal
        isOpen={formError !== ''}
        onClose={() => setFormError('')}
        title={'Error'}
        message={formError}
        type={'error'}
      />
      {/* Success toast (auto hides itself and consumes the message, setting it to empty string) */}
      <Toast message={formSuccessMessage} type={'success'} onDismiss={() => setFormSuccessMessage('')} />

      <div className="flex h-[calc(100vh-64px)] w-full">

        {/* Animated Report Form - visible on the LEFT */}
        <div
          id="scrollableFormSubmitReport"
          className={`transition-all duration-500 ease-in-out overflow-hidden relative
            ${isFormVisible && selectedLocation 
              ? 'w-1/3 opacity-100 pointer-events-auto bg-gray-50 border-r p-6 overflow-y-auto' 
              : 'w-0 opacity-0 pointer-events-none'
            }`}
          style={{ minWidth: isFormVisible && selectedLocation ? 320 : 0 }}
        >
          {/* Only render form content if visible, to avoid tab order issues */}
          {isFormVisible && selectedLocation && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Report Details</h2>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                  title="Close Form"
                >
                  {/* Tailwind X icon or similar */}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                **Selected Location:**
              </p>
              <form onSubmit={handleCreateReport} className="space-y-4">

                {/* Latitude Field (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input
                    type="text"
                    value={selectedLocation.lat.toFixed(6)}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 p-2 text-sm"
                  />
                </div>

                {/* Longitude Field (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input
                    type="text"
                    value={selectedLocation.lng.toFixed(6)}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 p-2 text-sm"
                  />
                </div>

                {/* Report Type */}
                <div>
                  <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">Report Type</label>
                  <select
                    id="reportType"
                    value={categoryId}
                    onChange={(e) => {
                      const selectedCategory = e.target.value;
                      setCategoryId(parseInt(selectedCategory));
                    }}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                    disabled={categories.length === 0}
                  >
                    <option value={0} disabled>
                      {categories.length === 0 ? 'Loading categories...' : 'Select a category'}
                    </option>
                    {categories.map((cat: ReportCategory) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon + " " + cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    id="title"
                    type='text'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                  />
                </div>
                {/* Anonymous Checkbox */}
                <label htmlFor="anonymous" className="flex items-center space-x-2 cursor-pointer group">
                  <div className="relative flex items-center h-5">
                    <input
                      id='anonymous'
                      type='checkbox'
                      checked={isAnonymous}
                      onChange={() => setIsAnonymous(!isAnonymous)}
                      // Hide the default browser checkbox
                      className="hidden"
                    />

                    {/* Custom Checkbox Appearance */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 transition-all duration-200 
                ${isAnonymous
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-400 group-hover:border-blue-500'
                        }
                flex items-center justify-center`}
                    >
                      {/* Checkmark Icon (Visible only when checked) */}
                      {isAnonymous && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <span className="text-sm font-medium text-gray-700 select-none">
                    Anonymous report
                  </span>
                </label>

                {/* File Input: Photos */}
                <FileInput
                  name="photos"
                  accept="image/*"
                  multiple={true} // Allow multiple selection
                  maxFiles={3} // Enforce the limit
                  onChange={handleFileChange}
                />

                <button
                  id="submitReportBtn"
                  type="submit"
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Report
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Map - visible on the RIGHT, takes remaining space, animates width */}
        <div
          className={`transition-all duration-500 ease-in-out h-full ${isFormVisible && selectedLocation ? 'w-2/3' : 'w-full'}`}
          style={{ minWidth: 0 }}
        >
          <MapContainer
            id="mapReport"
            center={TORINO_CENTER}
            zoom={12}
            scrollWheelZoom={true}
            className="h-full w-full"
            minZoom={11}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

              {/* Inverted mask: dark overlay outside Torino, and thin green border for allowed area */}
              {useMemo(() => {
                const geo: any = torinoGeo as any;
                // collect holes from torino geometry (supports FeatureCollection, Feature, Polygon, MultiPolygon)
                const holes: number[][][] = []

                const pushPolygonRings = (coords: any[]) => {
                  // coords is [ [lng,lat], ... ] or [ [ [lng,lat], ... ], [ ... holes ] ]
                  // For Polygon: coords is array of linear rings
                  coords.forEach((ring: any[]) => {
                    // ensure ring closes
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

                // world-sized outer ring (lng,lat) - make slightly larger than world bbox to avoid edge artifacts
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
                    <GeoJSON data={maskFeature} style={{ color: 'transparent', weight: 0, fillColor: '#000000', fillOpacity: 0.25 }} />
                    <GeoJSON data={torinoGeo as any} style={{ color: 'green', weight: 2, fillOpacity: 0 }} />
                  </>
                )
              }, [])}

            <LocationMarker
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
              onBoundaryWarning={() => setBoundaryWarning(true)}
            />
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default MapPage;