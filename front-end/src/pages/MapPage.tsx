// MapPage.tsx (Renamed from NewReportPage.tsx for brevity)

import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { reportAPI } from '../api/reports';
import type { ReportCategory } from './municipality/ReportsPage';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

// ICON FIX
const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;
// END ICON FIX

// --- Map Configuration ---
const TORINO_CENTER: [number, number] = [45.0703, 7.6869];

// Bounding box (SW and NE corners)
const TORINO_BOUNDS: [[number, number], [number, number]] = [
  [44.9, 7.5],
  [45.2, 7.8],
];

// Polygon path representing the bounds (used for visual highlighting)
// The path needs to trace the four corners of the bounding box
const TORINO_POLYGON_PATH: [number, number][] = [
  [TORINO_BOUNDS[0][0], TORINO_BOUNDS[0][1]], // SW
  [TORINO_BOUNDS[1][0], TORINO_BOUNDS[0][1]], // NW
  [TORINO_BOUNDS[1][0], TORINO_BOUNDS[1][1]], // NE
  [TORINO_BOUNDS[0][0], TORINO_BOUNDS[1][1]], // SE
];

interface Location {
  lat: number;
  lng: number;
}

// Component to handle map clicks and location selection
const LocationMarker: React.FC<{ onLocationSelect: (loc: Location) => void; selectedLocation: Location | null }> = ({ onLocationSelect, selectedLocation }) => {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      const [swLat, swLng] = TORINO_BOUNDS[0];
      const [neLat, neLng] = TORINO_BOUNDS[1];

      // Check if the clicked point is within the Torino bounds
      if (lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng) {
        onLocationSelect({ lat, lng });
      } else {
        alert('Location must be within the defined boundary of Torino!');
      }
    },
  });

  return selectedLocation ? (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
  ) : null;
};

// The main Map Page component
const MapPage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formWarning, setFormWarning] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');
  const [categories, setCategories] = useState<ReportCategory[]>([]);

  // When this component is mounted for the first time, call the server api for loading the report categories
  useEffect(() => {
    reportAPI.getReportCategories()
      .then((repCategories: ReportCategory[]) => {
        setCategories(repCategories);
      }).catch(error => {
        console.log('Could not fetch report categories: ' + error);
      });
  }, []);

  const handleLocationSelect = (loc: Location) => {
    setSelectedLocation(loc);
    setIsFormVisible(true);
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
    else if (categoryId == 0) error = 'Please select a report category';

    setFormWarning(error);
    return error == '';
  }

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 3) {
      setFormWarning('You can select a maximum of 3 photos.');
      e.target.value = '';
      setPhotos(null);
      return;
    }
    setFormWarning('');
    setPhotos(e.target.files);
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReport()) {
      return;
    }

    /*const reportData = {
      ...selectedLocation,
      title,
      description,
      categoryId
    };*/
    const formData = new FormData();
    // Note: All non-file fields must be appended as strings/numbers
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category_id', categoryId.toString());
    formData.append('latitude', selectedLocation!.lat.toString());
    formData.append('longitude', selectedLocation!.lng.toString());
    formData.append('is_public', (!isAnonymous).toString());

    /*const reportData: CreateReportData = {
      title, description, categoryId,
      'latitude': selectedLocation!.lat,
      'longitude': selectedLocation!.lng,
      'is_public': !isAnonymous
    };*/

    if (photos)
      for (let i = 0; i < photos.length; i++)
        formData.append('photos', photos[i]);
    /*if (photos) {
      reportData.photos = [];
      for (let i = 0; i < photos.length; i++)
        reportData.photos.push(photos[i]);
    }*/

    console.log('Report to send:', formData);
    reportAPI.createReport(formData).then(savedReport => {
      // Reset form after successful submission
      setFormSuccessMessage('Report sent successfully!');
      handleCloseForm();

    }).catch(err => {
      console.log(err);
    });
  };

  // Memoize Polygon options for performance
  const polygonOptions = useMemo(() => ({
    color: 'blue',
    fillColor: '#3b82f6', // Tailwind blue-500 equivalent
    fillOpacity: 0.15,
    weight: 3,
    dashArray: '5, 5'
  }), []);

  return (
    <>
      {/* Error modal - only shows up when the formError state is not empty */}
      <Modal
        isOpen={formWarning !== ''}
        onClose={() => setFormWarning('')}
        title={'Warning'}
        message={formWarning}
        type={'warning'}
      />
      {/* Success toast (auto hides itself and consumes the message, setting it to empty string) */}
      <Toast message={formSuccessMessage} type={'success'} onDismiss={() => setFormSuccessMessage('')}/>

      <div className="flex h-[calc(100vh-64px)] w-full">

        {/* Report Form - visible on the LEFT */}
        {isFormVisible && selectedLocation && (
          <div className="w-1/3 p-6 border-r bg-gray-50 overflow-y-auto relative"> {/* Added relative for positioning the button */}
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
                    let selectedCategory = e.target.value;
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

              {/* Anonymous checkbox */}
              <div>
                <label htmlFor="anonymous" className="block text-sm font-medium text-gray-700">Anonymous report</label>
                <input
                  id='anonymous'
                  type='checkbox'
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(!isAnonymous)}
                />
              </div>

              {/* File Input: Photos */}
              <label>
                Photos (Max 3):
                <input
                  type="file"
                  name="photos"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
              </label>

              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Report
              </button>
            </form>
          </div>
        )}

        {/* Map Container - dynamically sized with Tailwind */}
        <div className={`transition-all duration-300 ${isFormVisible ? 'w-2/3' : 'w-full'} h-full`}>
          <MapContainer
            center={TORINO_CENTER}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full"
            maxBounds={TORINO_BOUNDS}
            maxBoundsViscosity={1.0}
            minZoom={12}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Highlight Selectable Area (Torino Bounds) */}
            <Polygon
              pathOptions={polygonOptions}
              positions={TORINO_POLYGON_PATH}
            />

            <LocationMarker
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
            />
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default MapPage;