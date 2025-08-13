<<<<<<< HEAD
# PDF Viewer & Form Field Editor

A web-based PDF viewer and form field editor built with React, allowing users to view PDFs, detect form fields, edit field names, and export updated PDFs.

## Features

### 📄 PDF Rendering
- **PDF.js Integration**: Uses `pdf.js` for high-quality PDF rendering in the browser
- **Zoom Controls**: Support for zooming in/out (50% to 300%)
- **Page Navigation**: Navigate between pages with controls or direct page input
- **Responsive Design**: Adapts to different screen sizes

### 🔍 Form Field Detection
- **Automatic Detection**: Automatically detects all interactive form fields in PDFs
- **Field Types Supported**:
  - Text Fields
  - Checkboxes
  - Radio Buttons
  - Dropdown/Select Fields
- **Visual Overlay**: Displays field names overlaid on the PDF with type indicators
- **Toggle Overlay**: Show/hide field overlays as needed

### ✏️ Field Name Editing
- **Inline Editing**: Click on any field to edit its name directly
- **Real-time Updates**: Changes are reflected immediately in the overlay
- **Field Selection**: Click on fields in the PDF to select them
- **Type Indicators**: Visual icons and badges show field types

### 💾 File Management
- **Upload Support**: Drag and drop or click to upload PDF files
- **Export Functionality**: Save updated PDFs with new field names
- **Error Handling**: Graceful error handling for invalid files

### 🎨 Modern UI/UX
- **Clean Interface**: Minimal, professional design with Tailwind CSS
- **Responsive Layout**: Works on desktop and tablet devices
- **Visual Feedback**: Hover effects, selections, and loading states
- **Accessibility**: Keyboard navigation and screen reader support

## Tech Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS
- **PDF Rendering**: `pdfjs-dist` (PDF.js)
- **PDF Editing**: `pdf-lib`
- **State Management**: Zustand
- **Icons**: Lucide React
- **Build Tool**: Vite

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd pdfViewer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage

### Uploading a PDF
1. Click the upload area or drag and drop a PDF file
2. The application will automatically detect and parse form fields
3. Form fields will be displayed as overlays on the PDF

### Viewing and Navigating
- Use the toolbar to navigate between pages
- Adjust zoom level using the zoom controls or dropdown
- Scroll through the PDF content

### Editing Field Names
1. **Select a field**: Click on any field overlay in the PDF
2. **Edit the name**: Click the edit button (✏️) in the sidebar
3. **Save changes**: Press Enter or click the save button
4. **Cancel editing**: Press Escape or click the cancel button

### Managing Field Overlays
- Toggle field overlay visibility using the "Show/Hide Field Overlay" button
- Selected fields are highlighted in red
- Field types are indicated with icons and color-coded badges

### Exporting Updated PDF
1. Make your desired changes to field names
2. Click the "Save PDF" button in the toolbar
3. The updated PDF will be downloaded automatically

## Project Structure

```
src/
├── components/
│   ├── FileUpload.jsx      # PDF file upload component
│   ├── PdfViewer.jsx       # Main PDF rendering component
│   ├── FieldEditor.jsx     # Form field editing sidebar
│   ├── Toolbar.jsx         # Navigation and controls toolbar
│   └── LoadingSpinner.jsx  # Loading state component
├── store/
│   └── pdfStore.js         # Zustand state management
├── App.jsx                 # Main application component
├── main.jsx               # React entry point
└── index.css              # Global styles and Tailwind imports
```

## How Form Fields Are Parsed

The application uses a dual-library approach for optimal performance:

1. **PDF.js (`pdfjs-dist`)**: Used for rendering PDFs in the browser
   - Provides high-quality rendering
   - Handles page navigation and zooming
   - Manages viewport calculations

2. **PDF-lib**: Used for form field detection and editing
   - Extracts form field metadata
   - Provides field type information
   - Enables field name modification
   - Handles PDF generation with updates

### Field Detection Process
1. Load PDF with both libraries simultaneously
2. Extract form fields using PDF-lib's `getForm().getFields()`
3. Parse field properties (name, type, bounds)
4. Create overlay elements positioned over detected fields
5. Enable interactive editing and selection

### Field Name Updates
1. User edits field name in the UI
2. Update is stored in the application state
3. When saving, PDF-lib modifies the actual PDF structure
4. Updated PDF is generated and downloaded

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Limitations

- **Field Positioning**: Current implementation uses approximate positioning for field overlays. For production use, you'd need to extract actual field coordinates from the PDF structure.
- **Complex Forms**: Very complex forms with nested fields may require additional handling.
- **File Size**: Large PDF files (>50MB) may take longer to load.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering library
- [PDF-lib](https://pdf-lib.js.org/) - PDF manipulation library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide React](https://lucide.dev/) - Beautiful icons
=======
# PDF-viewer
PDF 
>>>>>>> 36574103deadce5bfb693fc1ba5f69992016c382
