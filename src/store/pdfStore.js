import { create } from 'zustand'
import * as pdfjsLib from 'pdfjs-dist'

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
      
      // Use PDF.js fields for form field information
      const formFields = pdfJsFields.map((field, index) => ({
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
      
      // Validate PDF bytes
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error('PDF data is not available. Please upload a PDF file first.')
      }
      
      console.log('PDF bytes available:', pdfBytes.length, 'bytes')
      
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
        error: error.message || 'Failed to save PDF. Please try again.',
        isLoading: false 
      })
    }
  },
  
  // Helper function to create field modification instructions and download original PDF
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

      // Create a comprehensive field modification guide
      console.log('Creating field modification guide...')
      
      // Generate detailed instructions
      const instructions = changedFields.map((field, index) => {
        return `${index + 1}. Find field "${field.originalName}" (${field.type}) on page ${field.page}
   - Location: X=${field.bounds.x}, Y=${field.bounds.y}, Width=${field.bounds.width}, Height=${field.bounds.height}
   - Change name to: "${field.name}"`
      }).join('\n\n')
      
      // Create a comprehensive guide
      const guideText = `PDF Field Name Modification Guide
=====================================

Your PDF contains ${changedFields.length} field(s) that need to be renamed.

INSTRUCTIONS:
${instructions}

RECOMMENDED TOOLS:
• Adobe Acrobat Pro DC
• PDF-XChange Editor
• Foxit PDF Editor
• LibreOffice Draw
• Inkscape (free)

STEP-BY-STEP PROCESS:
1. Open the original PDF in your preferred PDF editor
2. Enable form editing mode
3. For each field listed above:
   - Right-click on the field
   - Select "Properties" or "Field Properties"
   - Change the field name from the old name to the new name
   - Save the changes
4. Save the modified PDF

FIELD DETAILS:
${changedFields.map(field => 
  `• ${field.originalName} → ${field.name}
  - Type: ${field.type}
  - Page: ${field.page}
  - Position: (${field.bounds.x}, ${field.bounds.y})
  - Size: ${field.bounds.width} × ${field.bounds.height}`
).join('\n')}

Note: The original PDF has been downloaded as "original-form.pdf".
Use this guide to manually update the field names in your PDF editor.`
      
      // Create the guide file
      console.log('Creating guide file with text:', guideText.length, 'characters')
      const guideBlob = new Blob([guideText], { type: 'text/plain' })
      console.log('Guide blob size:', guideBlob.size, 'bytes')
      const guideUrl = URL.createObjectURL(guideBlob)
      const guideLink = document.createElement('a')
      guideLink.href = guideUrl
      guideLink.download = 'field-modification-guide.txt'
      document.body.appendChild(guideLink)
      guideLink.click()
      document.body.removeChild(guideLink)
      URL.revokeObjectURL(guideUrl)
      
      // Download the original PDF
      console.log('Original PDF bytes length:', originalPdfBytes?.length || 'undefined')
      if (!originalPdfBytes || originalPdfBytes.length === 0) {
        throw new Error('Original PDF bytes are empty or undefined')
      }
      
      const blob = new Blob([originalPdfBytes], { type: 'application/pdf' })
      console.log('PDF blob size:', blob.size, 'bytes')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'original-form.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert(`Downloaded original PDF and detailed modification guide (${changedFields.length} changes).\n\nPlease use the guide to manually update field names in your PDF editor.`)
      
    } catch (error) {
      console.error('Error creating guide:', error)
      // Fallback to original PDF if guide creation fails
      const blob = new Blob([originalPdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'original-form.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('Failed to create guide. Original PDF downloaded instead.')
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
