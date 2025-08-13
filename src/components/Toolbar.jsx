import React from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react'
import usePdfStore from '../store/pdfStore'

const Toolbar = () => {
  const {
    currentPage,
    totalPages,
    scale,
    prevPage,
    nextPage,
    setCurrentPage,
    zoomIn,
    zoomOut,
    setScale,
    savePdf,
    isLoading
  } = usePdfStore()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Page Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center text-sm"
            />
            <span className="text-sm text-gray-500">of {totalPages}</span>
          </div>
          
          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          
          <select
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={0.5}>50%</option>
            <option value={0.75}>75%</option>
            <option value={1.0}>100%</option>
            <option value={1.25}>125%</option>
            <option value={1.5}>150%</option>
            <option value={2.0}>200%</option>
            <option value={3.0}>300%</option>
          </select>
          
          <button
            onClick={zoomIn}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={savePdf}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save PDF'}
        </button>
      </div>
    </div>
  )
}

export default Toolbar
