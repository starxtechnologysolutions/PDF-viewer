

**Prompt for Cursor:**

> Implement a web-based PDF viewer and form field editor with the following requirements:
>
> 1. **PDF Rendering**
>
>    * Use `pdf.js` to render the PDF in the browser.
>    * Support zooming, scrolling, and page navigation.
> 2. **Form Field Detection**
>
>    * Read all interactive form fields (text fields, checkboxes, radio buttons, etc.) from the PDF using a PDF parsing library like `pdf-lib` or `pdfjs-dist`.
>    * Display each field’s name (e.g., `text 1`, `text 2`, `check box 1`, `check box 2`) visually overlaid on the PDF, similar to Adobe or WPS PDF viewers.
>    * Allow toggling the overlay on/off.
> 3. **Editing Field Names**
>
>    * Provide a UI (sidebar or inline popup) to select a field and edit its name.
>    * Changes to field names should update both the overlay display and the internal PDF form data structure.
>    * Allow saving the updated PDF with the new field names.
> 4. **File Support**
>
>    * Allow users to upload a PDF from local storage.
>    * Export/download the updated PDF after editing.
> 5. **UI/UX**
>
>    * Clean and minimal UI, responsive layout.
>    * Highlight the currently selected field.
>    * Show field type (text, checkbox, radio, dropdown) alongside its name in the edit panel.
> 6. **Tech Stack**
>
>    * Frontend: React + TailwindCSS.
>    * PDF Rendering: `pdf.js` (`pdfjs-dist`) for display, `pdf-lib` for editing.
>    * State Management: React hooks or Zustand.
>
> **Deliverables**
>
> * A single-page React app that can open a PDF, detect and overlay form field names, allow renaming them, and export the updated PDF.
> * Code should be well-structured, with components for PDF rendering, field overlay, and field editor.
> * Include comments explaining how form fields are parsed, displayed, and updated.

---
