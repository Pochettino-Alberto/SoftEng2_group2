import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, {type LatLngTuple } from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import torinoGeo from '../assets/torino.geo.json';
import * as turf from "@turf/turf";
import { useMemo, useRef } from 'react';

import { reportAPI } from '../api/reports';
import type { ReportCategory, Report } from '../types/report';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import FileInput from '../components/FileInput';
import { reverseGeocode } from '../utils';

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

// Clustering helper: Groups reports by proximity based on zoom level
interface Cluster {
  lat: number;
  lng: number;
  reports: Report[];
  isCluster: boolean;
}

const clusterReports = (reports: Report[], zoomLevel: number): Cluster[] => {
  if (!reports || reports.length === 0) return [];
  

  const validReports = reports.filter(r => r.location && typeof r.location.lat === 'number' && typeof r.location.lng === 'number');
  
  if (validReports.length === 0) return [];
  
  if (zoomLevel >= 15) {
    return validReports.map(report => ({
      lat: report.location.lat,
      lng: report.location.lng,
      reports: [report],
      isCluster: false
    }));
  }
  
  let radiusInDegrees: number;
  if (zoomLevel >= 14) {
    radiusInDegrees = 0.002; 
  } else if (zoomLevel >= 13) {
    radiusInDegrees = 0.005;
  } else if (zoomLevel >= 12) {
    radiusInDegrees = 0.01; 
  } else if (zoomLevel >= 11) {
    radiusInDegrees = 0.02; 
  } else {
    radiusInDegrees = 0.05; 
  }
  
  const clusters: Cluster[] = [];
  const processed = new Set<number>();
  
  validReports.forEach((report, index) => {
    if (processed.has(index)) return;
    
    const nearbyReports = [report];
    processed.add(index);
    
    validReports.forEach((otherReport, otherIndex) => {
      if (processed.has(otherIndex)) return;
      
      const latDiff = Math.abs(report.location.lat - otherReport.location.lat);
      const lngDiff = Math.abs(report.location.lng - otherReport.location.lng);
      
      if (latDiff <= radiusInDegrees && lngDiff <= radiusInDegrees) {
        nearbyReports.push(otherReport);
        processed.add(otherIndex);
      }
    });
    
    if (nearbyReports.length > 1) {
      const avgLat = nearbyReports.reduce((sum, r) => sum + r.location.lat, 0) / nearbyReports.length;
      const avgLng = nearbyReports.reduce((sum, r) => sum + r.location.lng, 0) / nearbyReports.length;
      
      clusters.push({
        lat: avgLat,
        lng: avgLng,
        reports: nearbyReports,
        isCluster: true
      });
    } else {
      clusters.push({
        lat: report.location.lat,
        lng: report.location.lng,
        reports: [report],
        isCluster: false
      });
    }
  });
  
  return clusters;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Resolved':
      return '#10b981'; 
    case 'In Progress':
      return '#3b82f6'; 
    case 'Assigned':
      return '#3b82f6';
    case 'Suspended':
      return '#f59e0b'; 
    default:
      return '#6b7280'; 
  }
};

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
    <Marker 
      position={[selectedLocation.lat, selectedLocation.lng]}
      icon={L.icon({
        iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.3 12.5 28.3s12.5-15.8 12.5-28.3C25 5.6 19.4 0 12.5 0z" fill="%23999999"/><circle cx="12.5" cy="12.5" r="4" fill="white"/></svg>',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })}
    />
  ) : null;
};

const MapZoomListener: React.FC<{ approvedReports: Report[] }> = ({ approvedReports }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(12);
  
  useMapEvents({
    zoomend() {
      setZoom(map.getZoom());
    }
  });
  
  const clusters = clusterReports(approvedReports, zoom);
  
  return (
    <>
      {clusters.map((cluster, idx) => (
        <Marker
          key={idx}
          position={[cluster.lat, cluster.lng]}
          icon={L.icon({
            iconUrl: cluster.isCluster && cluster.reports.length > 1 
              ? 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="%233b82f6" stroke="white" stroke-width="2"/><text x="20" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="white">' + cluster.reports.length + '</text></svg>'
              : icon,
            iconSize: cluster.isCluster && cluster.reports.length > 1 ? [40, 40] : [25, 41],
            iconAnchor: cluster.isCluster && cluster.reports.length > 1 ? [20, 20] : [12, 41],
          })}
        >
          {cluster.isCluster && cluster.reports.length > 1 ? (
            <Popup>
              <div className="w-80 max-h-96 overflow-y-auto">
                <h3 className="font-bold mb-3 text-lg">
                  {cluster.reports.length} Report{cluster.reports.length !== 1 ? 's' : ''} in this area
                </h3>
                <div className="space-y-3">
                  {cluster.reports.map((report) => (
                    <div key={report.id} className="border-l-4 pl-3 py-2" style={{ borderColor: getStatusColor(report.status) }}>
                      <p className="font-semibold text-sm">{report.title}</p>
                      <p className="text-xs text-gray-600 mb-1">{report.description?.substring(0, 80)}...</p>
                      <div className="flex justify-between text-xs">
                        <span className="inline-block px-2 py-1 rounded text-white" style={{ backgroundColor: getStatusColor(report.status) }}>
                          {report.status}
                        </span>
                        <span className="text-gray-500">
                          {report.is_public 
                            ? `${report.reporter?.first_name || ''} ${report.reporter?.last_name || ''}`.trim()
                            : 'Anonymous'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          ) : cluster.reports.length === 1 ? (
            <Popup>
              <div className="w-80">
                <h3 className="font-bold text-lg mb-2">{cluster.reports[0].title}</h3>
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 rounded text-white text-sm font-semibold" style={{ backgroundColor: getStatusColor(cluster.reports[0].status) }}>
                    {cluster.reports[0].status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{cluster.reports[0].description}</p>
                <div className="mb-3 text-sm">
                  <p><strong>Category:</strong> {cluster.reports[0].category?.name || 'Unknown'}</p>
                  <p><strong>Reporter:</strong> {cluster.reports[0].is_public 
                    ? `${cluster.reports[0].reporter?.first_name || ''} ${cluster.reports[0].reporter?.last_name || ''}`.trim()
                    : 'Anonymous'}</p>
                  <p className="text-xs text-gray-500"><strong>Updated:</strong> {new Date(cluster.reports[0].updatedAt).toLocaleDateString()}</p>
                </div>
                {cluster.reports[0].photos && cluster.reports[0].photos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold mb-2">Photos:</p>
                    <div className="flex gap-2 flex-wrap">
                      {cluster.reports[0].photos.slice(0, 2).map((photo, pidx) => (
                        <img
                          key={pidx}
                          src={photo.photo_public_url}
                          alt={`Report photo ${pidx + 1}`}
                          className="h-16 w-16 object-cover rounded"
                        />
                      ))}
                      {cluster.reports[0].photos.length > 2 && (
                        <div className="h-16 w-16 bg-gray-300 rounded flex items-center justify-center text-xs font-bold">
                          +{cluster.reports[0].photos.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          ) : null}
        </Marker>
      ))}
    </>
  );
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
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [boundaryWarning, setBoundaryWarning] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const formScrollRef = useRef<HTMLDivElement>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  
  // New state for approved reports display
  const [approvedReports, setApprovedReports] = useState<Report[]>([]);


  const handleFormScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 10;
    setIsScrolledToBottom(isAtBottom);
  };

  const scrollToBottom = () => {
    if (formScrollRef.current) {
      formScrollRef.current.scrollTo({
        top: formScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };


  useEffect(() => {
    reportAPI.getReportCategories()
      .then((repCategories: ReportCategory[]) => {
        setCategories(repCategories);
      }).catch(error => {
        setFormError('Could not fetch report categories: ' + error.message);
        console.log('Could not fetch report categories: ' + error);
      });
  }, []);

  // Fetch approved reports for display on map
  const fetchApprovedReports = async () => {
    try {
      console.log('Fetching approved reports...');
      // Only fetch reports with approved statuses (exclude Pending Approval and Rejected)
      const approvedStatuses = ["Assigned", "In Progress", "Suspended"]
      const reports = await reportAPI.getMapReports(approvedStatuses);
      console.log('Received reports:', reports);
      setApprovedReports(reports || []);
    } catch (error) {
      console.error('Failed to load approved reports:', error);
      // Don't set form error, just log it
      // setFormError('Could not load approved reports');
    }
  };

  useEffect(() => {
    // Auto-load approved reports on mount
    try {
      fetchApprovedReports();
    } catch (err) {
      console.error('Error in fetchApprovedReports useEffect:', err);
    }
  }, []);

  const handleLocationSelect = (loc: Location | null) => {
    setSelectedLocation(loc);
    setIsFormVisible(loc !== null);
  };


  useEffect(() => {
    let mounted = true;
    if (!selectedLocation) {
      setAddress(null);
      setAddressLoading(false);
      return;
    }

    const { lat, lng } = selectedLocation;
    setAddressLoading(true);
    reverseGeocode(lat, lng)
      .then((addr) => {
        if (!mounted) return;
        setAddress(addr);
      })
      .catch((err) => {
        console.warn('reverseGeocode failed in MapPage', err);
        if (!mounted) return;
        setAddress(null);
      })
      .finally(() => {
        if (!mounted) return;
        setAddressLoading(false);
      });

    return () => { mounted = false };
  }, [selectedLocation]);

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

  
  const handleFileChange = (files: File[]) => {
    setPhotos(files);
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReport()) {
      return;
    }

    const formData = new FormData();

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
    setIsUploading(true);
    reportAPI.createReport(formData).then(savedReport => {
      console.log(savedReport);
      // Reset form after successful submission
      setFormSuccessMessage('Report created successfully! You will be able to see it on the map after it has been approved.');
      handleCloseForm();

    }).catch(err => {
      setFormError('Failed to create report: ' + err.message);
      console.log(err);
    }).finally(() => {
      setIsUploading(false);
    });
  };

  return (
    <>

      <Modal
        isOpen={boundaryWarning}
        onClose={() => setBoundaryWarning(false)}
        title={'Invalid Location'}
        message={'Location must be inside the city of Torino!'}
        type={'warning'}
      />
     
      <Modal
        isOpen={formWarning !== ''}
        onClose={() => setFormWarning('')}
        title={'Warning'}
        message={formWarning}
        type={'warning'}
      />

      <Modal
        isOpen={formError !== ''}
        onClose={() => setFormError('')}
        title={'Error'}
        message={formError}
        type={'error'}
      />
  
      <Toast message={formSuccessMessage} type={'success'} onDismiss={() => setFormSuccessMessage('')} />

    
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4 shadow-lg">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <div>
              <div className="font-medium text-gray-900">Uploading report</div>
              <div className="text-sm text-gray-600">This may take a moment — please don’t close the tab.</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full">

       
        {isFormVisible && selectedLocation && (
  <div className="relative flex flex-col md:w-1/3 md:h-full w-full max-h-[60vh] md:max-h-none border-t md:border-t-0 md:border-r border-gray-200 bg-gray-50">
        
          <div
            ref={formScrollRef}
            id="scrollableFormSubmitReport"
            onScroll={handleFormScroll}
   
            className={`transition-all duration-500 ease-in-out overflow-y-auto relative p-6 md:h-full`}
        >
      
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
        
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                **Selected Location:**
              </p>
              <form onSubmit={handleCreateReport} className="space-y-4">

               
                <div>
                  <label className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input
                    type="text"
                    value={selectedLocation.lat.toFixed(6)}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 p-2 text-sm"
                  />
                </div>

        
                <div>
                  <label className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input
                    type="text"
                    value={selectedLocation.lng.toFixed(6)}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 p-2 text-sm"
                  />
                </div>

          
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={addressLoading ? 'Resolving address...' : (address ?? 'Not available')}
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 p-2 text-sm"
                  />
                </div>

             
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
            
                <label htmlFor="anonymous" className="flex items-center space-x-2 cursor-pointer group">
                  <div className="relative flex items-center h-5">
                    <input
                      id='anonymous'
                      type='checkbox'
                      checked={isAnonymous}
                      onChange={() => setIsAnonymous(!isAnonymous)}
                 
                      className="hidden"
                    />

              
                    <div
                      className={`w-5 h-5 rounded-md border-2 transition-all duration-200 
                ${isAnonymous
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-400 group-hover:border-blue-500'
                        }
                flex items-center justify-center`}
                    >
                      
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

                <FileInput
                  name="photos"
                  accept="image/*"
                  multiple={true} 
                  maxFiles={3} 
                  onChange={handleFileChange}
                />

                <button
                  id="submitReportBtn"
                  type="submit"
                  disabled={isUploading}
                  className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isUploading ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    'Create Report'
                  )}
                </button>
              </form>
            </div>
          )}
          </div>
          
          {/* Scroll indicator - at bottom of form container, hidden when scrolled to bottom */}
          {!isScrolledToBottom && isFormVisible && selectedLocation && (
            <button
              onClick={scrollToBottom}
              // Show arrow only on small screens (hide on md and larger)
              className="w-full flex justify-center items-center py-2 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent border-b border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer md:hidden"
              title="Scroll to bottom of form"
            >
              <svg className="w-5 h-5 text-gray-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}
        </div>
        )}

        {/* Map - visible on the RIGHT, takes remaining space, animates width */}
        <div
          className={`transition-all duration-500 ease-in-out flex-1 ${isFormVisible && selectedLocation ? 'md:flex-[2]' : ''}`}
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

            {/* Display approved reports with clustering */}
            {approvedReports && approvedReports.length > 0 && <MapZoomListener approvedReports={approvedReports} />}

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