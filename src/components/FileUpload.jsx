import React, { useRef } from 'react'
import { Upload, FileText } from 'lucide-react'
import usePdfStore from '../store/pdfStore'

const FileUpload = () => {
  const fileInputRef = useRef(null)
  const { loadPdf } = usePdfStore()

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file.')
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB.')
        return
      }
      loadPdf(file)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file.')
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB.')
        return
      }
      loadPdf(file)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div
        className="w-full max-w-md p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-blue-100 rounded-full">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload a PDF file
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop your PDF here, or click to browse
            </p>
          </div>
          
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose PDF File
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default FileUpload
