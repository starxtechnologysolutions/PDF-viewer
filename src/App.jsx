import React from 'react'
import usePdfStore from './store/pdfStore'
import FileUpload from './components/FileUpload'
import PdfViewer from './components/PdfViewer'
import FieldEditor from './components/FieldEditor'
import Toolbar from './components/Toolbar'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { 
    pdfDocument, 
    isLoading, 
    error, 
    formFields, 
    showFieldOverlay,
    toggleFieldOverlay 
  } = usePdfStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              PDF Viewer & Form Editor
            </h1>
            <div className="flex items-center space-x-4">
              {pdfDocument && (
                <>
                  <button
                    onClick={toggleFieldOverlay}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      showFieldOverlay
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {showFieldOverlay ? 'Hide' : 'Show'} Field Overlay
                  </button>
                  <span className="text-sm text-gray-500">
                    {formFields.length} form fields detected
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && <LoadingSpinner />}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!pdfDocument ? (
          <FileUpload />
        ) : (
          <div className="flex gap-6">
            {/* PDF Viewer */}
            <div className="flex-1">
              <Toolbar />
              <PdfViewer />
            </div>
            
            {/* Field Editor Sidebar */}
            <div className="w-80">
              <FieldEditor />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
