import React, { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import usePdfStore from '../store/pdfStore'

const PdfViewer = () => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [pageRendered, setPageRendered] = useState(false)
  
  const {
    pdfDocument,
    currentPage,
    scale,
    formFields,
    selectedField,
    showFieldOverlay,
    selectField
  } = usePdfStore()

  useEffect(() => {
    if (!pdfDocument) return

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage)
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        const viewport = page.getViewport({ scale })
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        await page.render(renderContext).promise
        setPageRendered(true)
      } catch (error) {
        console.error('Error rendering PDF page:', error)
      }
    }

    renderPage()
  }, [pdfDocument, currentPage, scale])

  const handleFieldClick = (fieldId) => {
    selectField(fieldId)
  }

  const convertPdfToCanvasCoordinates = (field, canvasHeight) => {
    // PDF coordinates: origin at bottom-left, y increases upward
    // Canvas coordinates: origin at top-left, y increases downward
    
    const pdfBounds = field.bounds
    const viewport = field.viewport
    const canvasWidth = canvasRef.current?.width || 0
    
    if (viewport) {
      // The viewport gives us the PDF dimensions in points
      // We need to scale based on the actual canvas dimensions
      const scaleX = canvasWidth / viewport.width
      const scaleY = canvasHeight / viewport.height
      
      // Get canvas position relative to its container
      const canvas = canvasRef.current
      const canvasRect = canvas?.getBoundingClientRect()
      const containerRect = canvas?.parentElement?.getBoundingClientRect()
      
      const offsetX = canvasRect ? canvasRect.left - containerRect.left : 0
      const offsetY = canvasRect ? canvasRect.top - containerRect.top : 0
      
      const result = {
        x: pdfBounds.x * scaleX + offsetX,
        y: (viewport.height - (pdfBounds.y + pdfBounds.height)) * scaleY + offsetY,
        width: pdfBounds.width * scaleX,
        height: pdfBounds.height * scaleY
      }
      
      // Debug logging (remove in production)
      console.log('Field:', field.name, 'PDF bounds:', pdfBounds, 'Canvas bounds:', result, 'Viewport:', viewport, 'Canvas size:', { width: canvasWidth, height: canvasHeight }, 'Offsets:', { offsetX, offsetY })
      
      return result
    } else {
      // Fallback to simple conversion
      const result = {
        x: pdfBounds.x * scale,
        y: (canvasHeight - (pdfBounds.y + pdfBounds.height) * scale),
        width: pdfBounds.width * scale,
        height: pdfBounds.height * scale
      }
      
      console.log('Field:', field.name, 'PDF bounds:', pdfBounds, 'Canvas bounds (fallback):', result, 'Scale:', scale)
      
      return result
    }
  }

  const getFieldTypeIcon = (type) => {
    switch (type) {
      case 'PDFTextField':
        return '📝'
      case 'PDFCheckBox':
        return '☑️'
      case 'PDFRadioGroup':
        return '🔘'
      case 'PDFDropdown':
        return '📋'
      default:
        return '📄'
    }
  }

  const getFieldTypeName = (type) => {
    switch (type) {
      case 'PDFTextField':
        return 'Text Field'
      case 'PDFCheckBox':
        return 'Checkbox'
      case 'PDFRadioGroup':
        return 'Radio Button'
      case 'PDFDropdown':
        return 'Dropdown'
      default:
        return 'Unknown'
    }
  }

  if (!pdfDocument) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No PDF loaded</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div 
        ref={containerRef}
        className="pdf-container relative"
        style={{ maxHeight: '70vh', overflow: 'auto' }}
      >
        <div className="flex justify-center p-4">
          <div className="relative" style={{ padding: '0' }}>
            <canvas
              ref={canvasRef}
              className="pdf-page"
              style={{ display: 'block' }}
            />
            
            {/* Form Field Overlays */}
            {showFieldOverlay && pageRendered && formFields.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {formFields
                  .filter(field => field.page === currentPage)
                  .map((field) => {
                    const isSelected = selectedField === field.id
                    const canvasHeight = canvasRef.current?.height || 0
                    const scaledBounds = convertPdfToCanvasCoordinates(field, canvasHeight)
                    
                    return (
                      <div
                        key={field.id}
                        className="field-overlay pointer-events-auto"
                        style={{
                          left: `${scaledBounds.x}px`,
                          top: `${scaledBounds.y}px`,
                          width: `${scaledBounds.width}px`,
                          height: `${scaledBounds.height}px`
                        }}
                        onClick={() => handleFieldClick(field.id)}
                      >
                        <div className={`field-label ${isSelected ? 'selected' : ''}`}>
                          {getFieldTypeIcon(field.type)} {field.name}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Field Information Panel */}
      {selectedField !== null && showFieldOverlay && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {(() => {
            const field = formFields.find(f => f.id === selectedField)
            if (!field) return null
            
            return (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{field.name}</h4>
                  <p className="text-sm text-gray-500">
                    Type: {getFieldTypeName(field.type)}
                  </p>
                </div>
                <button
                  onClick={() => selectField(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default PdfViewer
