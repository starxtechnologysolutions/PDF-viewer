import { PDFDocument, PDFTextField, PDFCheckBox, rgb } from 'pdf-lib'
import { writeFileSync } from 'fs'

async function createTestPDF() {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])
  
  // Get the form from the document
  const form = pdfDoc.getForm()
  
  // Add a text field
  const textField = form.createTextField('text_field_1')
  textField.setText('Sample text')
  textField.addToPage(page, {
    x: 100,
    y: 700,
    width: 200,
    height: 30,
  })
  
  // Add a checkbox
  const checkBox = form.createCheckBox('checkbox_1')
  checkBox.check()
  checkBox.addToPage(page, {
    x: 100,
    y: 650,
    width: 20,
    height: 20,
  })
  
  // Add another text field
  const textField2 = form.createTextField('text_field_2')
  textField2.setText('Another field')
  textField2.addToPage(page, {
    x: 100,
    y: 600,
    width: 200,
    height: 30,
  })
  
  // Add another checkbox
  const checkBox2 = form.createCheckBox('checkbox_2')
  checkBox2.addToPage(page, {
    x: 100,
    y: 550,
    width: 20,
    height: 20,
  })
  
  // Add a text field with a different name
  const textField3 = form.createTextField('name_field')
  textField3.setText('John Doe')
  textField3.addToPage(page, {
    x: 100,
    y: 500,
    width: 200,
    height: 30,
  })
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save()
  writeFileSync('test-form.pdf', pdfBytes)
  
  console.log('Test PDF created: test-form.pdf')
  console.log('This PDF contains:')
  console.log('- text_field_1 (text field)')
  console.log('- checkbox_1 (checkbox)')
  console.log('- text_field_2 (text field)')
  console.log('- checkbox_2 (checkbox)')
  console.log('- name_field (text field)')
}

createTestPDF().catch(console.error)
