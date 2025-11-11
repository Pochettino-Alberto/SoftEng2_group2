import Card from '../components/Card';

const Reports = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Public Reports</h1>
          <p className="text-gray-600">View all submitted reports across Turin</p>
        </div>

        {/* Filter Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="border border-gray-300 rounded-lg px-4 py-2">
              <option>All Categories</option>
              <option>Water Supply</option>
              <option>Public Lighting</option>
              <option>Waste Management</option>
              <option>Road Maintenance</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-4 py-2">
              <option>All Statuses</option>
              <option>Pending Approval</option>
              <option>Assigned</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
            <input 
              type="date" 
              className="border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Start Date"
            />
            <input 
              type="date" 
              className="border border-gray-300 rounded-lg px-4 py-2"
              placeholder="End Date"
            />
          </div>
        </Card>

        {/* Map View */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Map View</h2>
          <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Interactive map will be displayed here (OpenStreetMap)</p>
          </div>
        </Card>

        {/* Reports List */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Reports List</h2>
            <button className="text-blue-600 hover:text-blue-700">
              Download CSV
            </button>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">No reports found. Try adjusting your filters.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
