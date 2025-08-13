import { create } from 'zustand'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, rgb } from 'pdf-lib'

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
      // Get the list of changed fields
      const changedFields = formFields.filter(field => field.name !== field.originalName)
      
      if (changedFields.length === 0) {
        // No changes, download original
        const blob = new Blob([originalPdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'original-form.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        alert('No field changes detected. Original PDF downloaded.')
        return
      }

      // Try to create a new PDF with annotations
      try {
        console.log('Attempting to create PDF with annotations...')
        
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create()
        console.log('Created new PDF document')
        
        // Load the original PDF
        console.log('Loading original PDF...')
        const originalPdf = await PDFDocument.load(originalPdfBytes)
        console.log('Original PDF loaded successfully')
        
        const pages = await pdfDoc.copyPages(originalPdf, originalPdf.getPageIndices())
        console.log(`Copied ${pages.length} pages from original PDF`)
        
        // Add all pages to the new document
        pages.forEach(page => pdfDoc.addPage(page))
        console.log('Added all pages to new document')
        
        // Add text annotations for field names
        const form = pdfDoc.getForm()
        let annotationCount = 0
        
        console.log(`Attempting to create annotations for ${changedFields.length} changed fields...`)
        
        changedFields.forEach((field, index) => {
          try {
            console.log(`Creating annotation for field: ${field.originalName} → ${field.name}`)
            console.log(`Field bounds:`, field.bounds)
            console.log(`Field page: ${field.page}`)
            
            // Create a text field annotation with the new name
            const textField = form.createTextField(`field_${index}_${field.name}`)
            textField.setText(field.name)
            
            const targetPage = pdfDoc.getPage(field.page - 1)
            console.log(`Target page index: ${field.page - 1}, page exists:`, !!targetPage)
            
            textField.addToPage(targetPage, {
              x: field.bounds.x,
              y: field.bounds.y,
              width: field.bounds.width,
              height: field.bounds.height
            })
            annotationCount++
            console.log(`Successfully created annotation for field ${field.name}`)
          } catch (error) {
            console.error(`Could not create annotation for field ${field.name}:`, error)
          }
        })
        
        console.log(`Created ${annotationCount} annotations successfully`)
        
        if (annotationCount > 0) {
          // Generate the new PDF
          console.log('Generating new PDF...')
          const newPdfBytes = await pdfDoc.save()
          console.log('New PDF generated successfully')
          
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
          
          alert(`Successfully created PDF with ${annotationCount} field name annotations!`)
          return
        } else {
          console.log('No annotations were created, trying alternative approach...')
          
          // Alternative approach: Create a new PDF with text overlays
          try {
            console.log('Creating new PDF with text overlays...')
            const newPdfDoc = await PDFDocument.create()
            
            // Add a blank page
            const page = newPdfDoc.addPage([612, 792]) // Standard letter size
            
            // Add text for each changed field
            changedFields.forEach((field, index) => {
              const text = `${field.originalName} → ${field.name}`
              page.drawText(text, {
                x: 50,
                y: 750 - (index * 30), // Stack text vertically
                size: 12,
                color: rgb(0, 0, 0)
              })
            })
            
            // Add title
            page.drawText('Field Name Changes Summary', {
              x: 50,
              y: 780,
              size: 16,
              color: rgb(0, 0, 0)
            })
            
            const newPdfBytes = await newPdfDoc.save()
            
            // Create download link
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'field-changes-summary.pdf'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            
            alert(`Created field changes summary PDF with ${changedFields.length} changes!`)
            return
          } catch (altError) {
            console.error('Alternative PDF creation also failed:', altError)
          }
        }
      } catch (pdfError) {
        console.error('PDF annotation creation failed, falling back to summary:', pdfError)
      }
      
      // Fallback: Create a summary of changes
      const summary = changedFields.map(field => 
        `• ${field.originalName} → ${field.name} (${field.type})`
      ).join('\n')
      
      // Create a text file with the changes summary
      const summaryText = `Field Name Changes Summary\n\n${summary}\n\nNote: The original PDF has been downloaded. Please manually update the field names in your PDF editor using this summary.`
      const summaryBlob = new Blob([summaryText], { type: 'text/plain' })
      const summaryUrl = URL.createObjectURL(summaryBlob)
      const summaryLink = document.createElement('a')
      summaryLink.href = summaryUrl
      summaryLink.download = 'field-changes-summary.txt'
      document.body.appendChild(summaryLink)
      summaryLink.click()
      document.body.removeChild(summaryLink)
      URL.revokeObjectURL(summaryUrl)
      
      // Download the original PDF
      const blob = new Blob([originalPdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'original-form.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert(`Downloaded original PDF and field changes summary (${changedFields.length} changes). Please use the summary to manually update your PDF.`)
      
    } catch (error) {
      console.error('Error creating summary:', error)
      // Fallback to original PDF if summary creation fails
      const blob = new Blob([originalPdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'original-form.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('Failed to create summary. Original PDF downloaded instead.')
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
