import Card from '../components/Card';

const Statistics = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Public Statistics</h1>
          <p className="text-gray-600">View community impact and report trends</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">1,234</div>
              <div className="text-gray-600 text-sm">Total Reports</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">856</div>
              <div className="text-gray-600 text-sm">Resolved</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">234</div>
              <div className="text-gray-600 text-sm">In Progress</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">144</div>
              <div className="text-gray-600 text-sm">Pending</div>
            </div>
          </Card>
        </div>

        {/* Reports by Category */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Reports by Category</h2>
          <div className="space-y-4">
            {[
              { name: 'Road Maintenance', count: 345, color: 'bg-blue-600' },
              { name: 'Public Lighting', count: 267, color: 'bg-green-600' },
              { name: 'Waste Management', count: 198, color: 'bg-yellow-600' },
              { name: 'Water Supply', count: 156, color: 'bg-cyan-600' },
              { name: 'Green Areas', count: 134, color: 'bg-emerald-600' },
              { name: 'Traffic Signs', count: 89, color: 'bg-orange-600' },
              { name: 'Other', count: 45, color: 'bg-gray-600' },
            ].map((category, index) => (
              <div key={index} className="flex items-center">
                <div className="w-40 text-sm font-medium">{category.name}</div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div 
                      className={`${category.color} h-full flex items-center justify-end px-2`}
                      style={{ width: `${(category.count / 345) * 100}%` }}
                    >
                      <span className="text-white text-xs font-bold">{category.count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Trend */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Monthly Trend</h2>
          <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart visualization will be displayed here</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
