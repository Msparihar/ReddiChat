import { createContext, useContext, useState } from 'react'

const FileContext = createContext()

export const useFileContext = () => {
  const context = useContext(FileContext)
  if (!context) {
    throw new Error('useFileContext must be used within a FileProvider')
  }
  return context
}

export const FileProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([])

  const addFiles = (files) => {
    setSelectedFiles(prevFiles => [...prevFiles, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    setSelectedFiles([])
  }

  const value = {
    selectedFiles,
    addFiles,
    removeFile,
    clearFiles
  }

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  )
}
