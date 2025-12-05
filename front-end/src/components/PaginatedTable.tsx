import React from 'react';
import Button from './Button';

type AccessorFn<T> = (row: T) => React.ReactNode;
type AccessorKey<T> = keyof T;

export interface Column<T> {
  header: string;
  accessor: AccessorKey<T> | AccessorFn<T>;
  className?: string;
}

export interface PaginatedTableProps<T> {
  paginatedData: {
    page_num: number;
    page_size: number;
    total_pages: number;
    total_items: number;
    items: T[];
  };
  columns: Column<T>[];
  onPageChange?: (newPage: number) => void;
  onRowClick?: (row: T) => void;
  className?: string;
  tableId?: string;
}

function PaginatedTable<T>({
  paginatedData,
  columns,
  onPageChange,
  onRowClick,
  className = '',
  tableId = '',
}: PaginatedTableProps<T>) {
  const { page_num, total_pages, total_items, items } = paginatedData;

  const goToPage = (page: number) => {
    if (onPageChange) onPageChange(page);
  };

  return (
    <div className={`overflow-x-auto bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="mb-2 text-gray-600 text-sm">
        Showing page {page_num} of {total_pages} — Total items: {total_items}
      </div>

      <table id={tableId} className="min-w-full border-collapse text-sm text-left text-gray-700">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={`${col.header ?? 'col'}-${idx}`}
                className={`px-4 py-2 font-semibold border-b ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((row: T, rowIndex: number) => (
              <tr
                id={(row as any).id ?? ""}
                key={(row as any).id ?? rowIndex}
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={onRowClick ? (e) => {
                  // don't trigger row click when the user clicked an interactive element (link, button, input, etc.)
                  const el = (e.target as HTMLElement).closest('a,button,input,textarea,select,label');
                  if (el) return;
                  onRowClick(row)
                } : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((col, colIndex) => {
                  const value =
                    typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode);
                  return (
                    <td
                      key={colIndex}
                      className={`px-4 py-2 border-b ${col.className || ''}`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr id="no-data-in-table">
              <td
                colSpan={columns.length}
                className="text-center text-gray-500 py-6"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

   
      {total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => goToPage(page_num - 1)}
            disabled={page_num === 1}
          >
            Previous
          </Button>

          <span className="text-gray-600 text-sm">
            Page {page_num} of {total_pages}
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={() => goToPage(page_num + 1)}
            disabled={page_num === total_pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default PaginatedTable;
