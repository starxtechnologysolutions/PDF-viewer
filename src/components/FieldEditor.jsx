import React, { useState } from 'react'
import { Edit3, Save, X, Type, Hash } from 'lucide-react'
import usePdfStore from '../store/pdfStore'

const FieldEditor = () => {
  const { formFields, selectedField, updateFieldName } = usePdfStore()
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleEditClick = (field) => {
    setEditingField(field.id)
    setEditValue(field.name)
  }

  const handleSave = () => {
    if (editingField !== null && editValue.trim()) {
      updateFieldName(editingField, editValue.trim())
      setEditingField(null)
      setEditValue('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue('')
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

  const getFieldTypeColor = (type) => {
    switch (type) {
      case 'PDFTextField':
        return 'bg-blue-100 text-blue-800'
      case 'PDFCheckBox':
        return 'bg-green-100 text-green-800'
      case 'PDFRadioGroup':
        return 'bg-purple-100 text-purple-800'
      case 'PDFDropdown':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (formFields.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="text-center">
          <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Form Fields
          </h3>
          <p className="text-sm text-gray-500">
            Upload a PDF with form fields to start editing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Hash className="h-5 w-5 mr-2" />
          Form Fields ({formFields.length})
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Click on a field to edit its name
        </p>
      </div>

      {/* Field List */}
      <div className="max-h-96 overflow-y-auto">
        {formFields.map((field) => (
          <div
            key={field.id}
            className={`px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              selectedField === field.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Field Type Badge */}
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">{getFieldTypeIcon(field.type)}</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFieldTypeColor(field.type)}`}>
                    {getFieldTypeName(field.type)}
                  </span>
                </div>

                                 {/* Field Name */}
                 {editingField === field.id ? (
                   <div className="flex items-center space-x-2">
                     <input
                       type="text"
                       value={editValue}
                       onChange={(e) => setEditValue(e.target.value)}
                       className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       autoFocus
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           handleSave()
                         } else if (e.key === 'Escape') {
                           handleCancel()
                         }
                       }}
                     />
                     <button
                       onClick={handleSave}
                       className="p-1 text-green-600 hover:text-green-700"
                       title="Save"
                     >
                       <Save className="h-4 w-4" />
                     </button>
                     <button
                       onClick={handleCancel}
                       className="p-1 text-gray-400 hover:text-gray-600"
                       title="Cancel"
                     >
                       <X className="h-4 w-4" />
                     </button>
                   </div>
                 ) : (
                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                       <span className="text-sm font-medium text-gray-900 truncate">
                         {field.name}
                       </span>
                       {field.name !== field.originalName && (
                         <span className="text-xs text-green-600 bg-green-100 px-1 py-0.5 rounded">
                           Modified
                         </span>
                       )}
                     </div>
                     <button
                       onClick={() => handleEditClick(field)}
                       className="p-1 text-gray-400 hover:text-gray-600 ml-2"
                       title="Edit field name"
                     >
                       <Edit3 className="h-4 w-4" />
                     </button>
                   </div>
                 )}

                {/* Original Name (if different) */}
                {field.name !== field.originalName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Original: {field.originalName}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        {showSuccess && (
          <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-xs">
            ✓ Field name updated successfully!
          </div>
        )}
        <div className="text-xs text-gray-500">
          <p>• Click on a field in the PDF to select it</p>
          <p>• Use the edit button to rename fields</p>
          <p>• Save to download PDF and detailed modification guide</p>
          {formFields.some(field => field.name !== field.originalName) && (
            <p className="text-blue-600 mt-2">
              📋 Field name changes will be included in a detailed modification guide
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FieldEditor
