import { create } from 'zustand'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument } from 'pdf-lib'

// Set up PDF.js worker to use a local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

const usePdfStore = create((set, get) => ({
  // PDF state
  pdfDocument: null,
  pdfBytes: null,
  currentPage: 1,
  totalPages: 0,
  scale: 1.0,
  
  // Form fields state
  formFields: [],
  selectedField: null,
  showFieldOverlay: true,
  
  // UI state
  isLoading: false,
  error: null,
  
  // PDF loading and parsing
  loadPdf: async (file) => {
    set({ isLoading: true, error: null })
    
    try {
      // Validate file type
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Please select a valid PDF file.')
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size must be less than 50MB.')
      }
      
      const arrayBuffer = await file.arrayBuffer()
      const pdfBytes = new Uint8Array(arrayBuffer)
      
      // Validate PDF header (should start with %PDF)
      const header = new TextDecoder().decode(pdfBytes.slice(0, 4))
      if (!header.startsWith('%PDF')) {
        throw new Error('Invalid PDF file. File does not contain a valid PDF header.')
      }
      
      // Load with pdf.js for rendering first
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes })
      const pdfDocument = await loadingTask.promise
      
      // Get form field information from PDF.js for better positioning
      const pdfJsFields = []
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum)
        const annotations = await page.getAnnotations()
        
        annotations.forEach(annotation => {
          if (annotation.subtype === 'Widget') {
            const fieldName = annotation.fieldName || annotation.fieldValue
            if (fieldName) {
              // Get the viewport to understand the coordinate system
              const viewport = page.getViewport({ scale: 1.0 })
              
              pdfJsFields.push({
                name: fieldName,
                bounds: annotation.rect,
                page: pageNum,
                type: annotation.fieldType || 'unknown',
                viewport: {
                  width: viewport.width,
                  height: viewport.height
                }
              })
            }
          }
        })
      }
      
      // Now load with pdf-lib for form field editing
      let pdfDoc, form, fields
      try {
        pdfDoc = await PDFDocument.load(pdfBytes)
        form = pdfDoc.getForm()
        fields = form.getFields()
      } catch (pdfLibError) {
        console.warn('PDF-lib failed to load, using PDF.js fields only:', pdfLibError)
        // If PDF-lib fails, we'll use the fields from PDF.js
        fields = []
      }
      
      // Parse form fields and their properties
      let formFields = []
      
      if (fields && fields.length > 0) {
        // Use PDF-lib fields if available
        formFields = fields.map((field, index) => {
          const fieldType = field.constructor.name
          const fieldName = field.getName() || `field_${index + 1}`
          
          // Try to find matching field from PDF.js for better positioning
          let bounds = {
            x: 100 + (index * 50),
            y: 100 + (index * 30),
            width: 150,
            height: 20
          }
          
                  const matchingField = pdfJsFields.find(f => f.name === fieldName)
        if (matchingField) {
          // PDF.js coordinates are in PDF points (1/72 inch)
          // We need to convert them to the canvas coordinate system
          bounds = {
            x: matchingField.bounds[0],
            y: matchingField.bounds[1],
            width: matchingField.bounds[2] - matchingField.bounds[0],
            height: matchingField.bounds[3] - matchingField.bounds[1]
          }
        }
          
          return {
            id: index,
            name: fieldName,
            type: fieldType,
            bounds,
            originalName: fieldName,
            field: field, // Reference to the actual field object
            page: matchingField?.page || 1,
            viewport: matchingField?.viewport
          }
        })
      } else {
        // Use PDF.js fields if PDF-lib failed
        formFields = pdfJsFields.map((field, index) => ({
          id: index,
          name: field.name,
          type: field.type,
          bounds: {
            x: field.bounds[0],
            y: field.bounds[1],
            width: field.bounds[2] - field.bounds[0],
            height: field.bounds[3] - field.bounds[1]
          },
          originalName: field.name,
          field: null, // No PDF-lib field reference
          page: field.page,
          viewport: field.viewport
        }))
      }
      
      console.log('Form fields loaded:', formFields)
      set({
        pdfDocument,
        pdfBytes,
        totalPages: pdfDocument.numPages,
        formFields,
        isLoading: false
      })
      
    } catch (error) {
      console.error('Error loading PDF:', error)
      let errorMessage = 'Failed to load PDF. Please make sure it\'s a valid PDF file.'
      
      if (error.message.includes('PDF header')) {
        errorMessage = 'Invalid PDF file. The file does not appear to be a valid PDF document.'
      } else if (error.message.includes('File size')) {
        errorMessage = error.message
      } else if (error.message.includes('valid PDF file')) {
        errorMessage = error.message
      }
      
      set({ 
        error: errorMessage,
        isLoading: false 
      })
    }
  },
  
  // Navigation
  setCurrentPage: (page) => {
    const { totalPages } = get()
    if (page >= 1 && page <= totalPages) {
      set({ currentPage: page })
    }
  },
  
  nextPage: () => {
    const { currentPage, totalPages } = get()
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 })
    }
  },
  
  prevPage: () => {
    const { currentPage } = get()
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 })
    }
  },
  
  // Zoom controls
  setScale: (scale) => {
    set({ scale: Math.max(0.5, Math.min(3.0, scale)) })
  },
  
  zoomIn: () => {
    const { scale } = get()
    set({ scale: Math.min(3.0, scale + 0.25) })
  },
  
  zoomOut: () => {
    const { scale } = get()
    set({ scale: Math.max(0.5, scale - 0.25) })
  },
  
  // Field management
  selectField: (fieldId) => {
    set({ selectedField: fieldId })
  },
  
  updateFieldName: (fieldId, newName) => {
    const { formFields } = get()
    console.log('Updating field name:', fieldId, 'to:', newName)
    const updatedFields = formFields.map(field => 
      field.id === fieldId 
        ? { ...field, name: newName }
        : field
    )
    set({ formFields: updatedFields })
  },
  
  toggleFieldOverlay: () => {
    const { showFieldOverlay } = get()
    set({ showFieldOverlay: !showFieldOverlay })
  },
  
  // Save PDF with updated field names
  savePdf: async () => {
    const { pdfBytes, formFields } = get()
    
    try {
      set({ isLoading: true })
      
      // Check if we have any field name changes
      const hasChanges = formFields.some(field => field.name !== field.originalName)
      
      if (!hasChanges) {
        alert('No field name changes detected. The original PDF will be downloaded.')
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'original-form.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        set({ isLoading: false })
        return
      }
      
            // Try to create a new PDF with field name annotations
      try {
        await get().createNewPdfWithAnnotations(pdfBytes, formFields)
      } catch (error) {
        console.error('Error creating PDF with annotations:', error)
        // Fallback to original PDF
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'original-form.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        alert('Could not save field changes. Original PDF downloaded.')
      }
      
      set({ isLoading: false })
      
    } catch (error) {
      console.error('Error saving PDF:', error)
      set({ 
        error: 'Failed to save PDF. Please try again.',
        isLoading: false 
      })
    }
  },
  
  // Helper function to create a new PDF with field name annotations
  createNewPdfWithAnnotations: async (originalPdfBytes, formFields) => {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create()
      
      // Load the original PDF as a page
      const originalPdf = await PDFDocument.load(originalPdfBytes)
      const pages = await pdfDoc.copyPages(originalPdf, originalPdf.getPageIndices())
      
      // Add all pages to the new document
      pages.forEach(page => pdfDoc.addPage(page))
      
      // Add text annotations for field names
      const form = pdfDoc.getForm()
      let annotationCount = 0
      
      formFields.forEach((field, index) => {
        if (field.name !== field.originalName) {
          try {
            // Create a text field annotation with the new name
            const textField = form.createTextField(`field_${index}_${field.name}`)
            textField.setText(field.name)
            textField.addToPage(pdfDoc.getPage(field.page - 1), {
              x: field.bounds.x,
              y: field.bounds.y,
              width: field.bounds.width,
              height: field.bounds.height
            })
            annotationCount++
          } catch (error) {
            console.warn(`Could not create annotation for field ${field.name}:`, error)
          }
        }
      })
      
      if (annotationCount > 0) {
        // Generate the new PDF
        const newPdfBytes = await pdfDoc.save()
        
        // Create download link
        const blob = new Blob([newPdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'updated-form-with-annotations.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        alert(`Created new PDF with ${annotationCount} field name annotations!`)
      } else {
        // Fallback to original PDF
        const blob = new Blob([originalPdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'original-form.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        alert('Could not create field annotations. Original PDF downloaded.')
      }
      
    } catch (error) {
      console.error('Error creating new PDF with annotations:', error)
      // Fallback to original PDF if annotation creation fails
      const blob = new Blob([originalPdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'original-form.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('Failed to create annotations. Original PDF downloaded instead.')
    }
  },
  
  // Reset state
  reset: () => {
    set({
      pdfDocument: null,
      pdfBytes: null,
      currentPage: 1,
      totalPages: 0,
      scale: 1.0,
      formFields: [],
      selectedField: null,
      showFieldOverlay: true,
      isLoading: false,
      error: null
    })
  }
}))

export default usePdfStore
