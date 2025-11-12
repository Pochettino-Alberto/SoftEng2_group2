import { useState } from 'react';
import PaginatedTable from '../../components/PaginatedTable';
import type { Column } from '../../components/PaginatedTable';

export type ReportCategory = 'Water Supply' | 'Public Lighting' | 'Road Maintenance' | 'Waste Management' | 'Green Areas';
export type ReportStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface Location {
  address: string;
  city: string;
}

export interface Report {
  id: number;
  title: string;
  description: string;
  category: ReportCategory;
  location: Location;
  status: ReportStatus;
  anonymous: boolean;
  photos: string[];
  reporter?: string;
  createdAt: string;
  updatedAt: string;
}

// Mocked reports
const mockReports: Report[] = [
  {
    id: 1,
    title: 'Leaking pipe near park',
    description: 'There is a water leak near the central park fountain.',
    category: 'Water Supply',
    location: { address: 'Via Roma 12', city: 'Turin' },
    status: 'Pending',
    anonymous: false,
    photos: [],
    reporter: 'Alice',
    createdAt: '2025-11-01',
    updatedAt: '2025-11-02',
  },
  {
    id: 2,
    title: 'Pothole on Main St.',
    description: 'Large pothole causing traffic disruption.',
    category: 'Road Maintenance',
    location: { address: 'Corso Vittorio Emanuele 45', city: 'Turin' },
    status: 'In Progress',
    anonymous: true,
    photos: [],
    reporter: undefined,
    createdAt: '2025-10-30',
    updatedAt: '2025-11-01',
  },
  {
    id: 3,
    title: 'Broken lamp post',
    description: 'Streetlight not working in front of library.',
    category: 'Public Lighting',
    location: { address: 'Piazza Castello 3', city: 'Turin' },
    status: 'Resolved',
    anonymous: false,
    photos: [],
    reporter: 'Bob',
    createdAt: '2025-10-28',
    updatedAt: '2025-10-29',
  },
  {
    id: 4,
    title: 'Overflowing garbage bin',
    description: 'Garbage not collected for 3 days.',
    category: 'Waste Management',
    location: { address: 'Via Garibaldi 10', city: 'Turin' },
    status: 'Pending',
    anonymous: true,
    photos: [],
    reporter: undefined,
    createdAt: '2025-11-03',
    updatedAt: '2025-11-03',
  },
  {
    id: 5,
    title: 'Damaged playground equipment',
    description: 'Swing broken in public playground.',
    category: 'Green Areas',
    location: { address: 'Parco Valentino', city: 'Turin' },
    status: 'In Progress',
    anonymous: false,
    photos: [],
    reporter: 'Charlie',
    createdAt: '2025-11-02',
    updatedAt: '2025-11-04',
  },
];

export default function ReportsPage() {
  const pageSize = 2;
  const totalPages = Math.ceil(mockReports.length / pageSize);
  const [currentPage, setCurrentPage] = useState(1);

  // Create a paginated object matching the table's expected shape
  const paginatedData = {
    page_num: currentPage,
    page_size: pageSize,
    total_pages: totalPages,
    total_items: mockReports.length,
    items: mockReports.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const columns: Column<Report>[] = [
    { header: 'ID', accessor: 'id' as keyof Report },
    { header: 'Title', accessor: 'title' as keyof Report },
    { header: 'Category', accessor: 'category' as keyof Report },
    { header: 'Location', accessor: (r: Report) => `${r.location.address}, ${r.location.city}` },
    {
        header: 'Status',
        accessor: (r: Report) => (
        <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
            r.status === 'Resolved'
                ? 'bg-green-100 text-green-700'
                : r.status === 'In Progress'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}
        >
            {r.status}
        </span>
        ),
    },
    {
        header: 'Reporter',
        accessor: (r: Report) => (r.anonymous ? 'Anonymous' : r.reporter),
    },
    ];


  return (
    <div className="max-w-6xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">Reports</h2>
      <PaginatedTable
        paginatedData={paginatedData}
        columns={columns}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
