import React, { useRef, useState, useCallback, useMemo } from 'react';

// Type definitions
interface FileInputProps {
  name: string;
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  // onChange must receive a FileList or array of Files, matching native behavior
  onChange: (files: File[]) => void; 
}

/**
 * A custom styled file input component that hides the native input
 * and displays selected files as a list with a removal option.
 */
const FileInput: React.FC<FileInputProps> = ({
  name,
  accept,
  multiple = false,
  maxFiles = 3, // Default max limit
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Function to simulate clicking the hidden file input
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null); // Clear previous errors
    
    const newFiles = Array.from(event.target.files || []);
    let filesToProcess = [...selectedFiles, ...newFiles];

    // 1. Max Files Check
    if (filesToProcess.length > maxFiles) {
      setErrorMessage(`You can only upload a maximum of ${maxFiles} photos.`);
      // Truncate the array to the max allowed number
      filesToProcess = filesToProcess.slice(0, maxFiles);
    }

    // 2. Uniqueness Check (prevent duplicate file names)
    const uniqueFiles = filesToProcess.reduce((acc: File[], current) => {
      const existing = acc.find(file => file.name === current.name && file.size === current.size);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);

    setSelectedFiles(uniqueFiles);
    onChange(uniqueFiles);

    // Reset the value of the input to allow re-uploading the same file if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, [selectedFiles, maxFiles, onChange]);

  const handleRemoveFile = useCallback((fileToRemove: File) => {
    const updatedFiles = selectedFiles.filter(file => file !== fileToRemove);
    setSelectedFiles(updatedFiles);
    onChange(updatedFiles);
    // Reset error message if any
    setErrorMessage(null);
  }, [selectedFiles, onChange]);

  const isMaxFilesReached = selectedFiles.length >= maxFiles;
  
  // Use useMemo for stable component rendering, returning the list of files to display
  const fileListDisplay = useMemo(() => (
    <ul className="mt-4 space-y-2">
      {selectedFiles.map((file, index) => (
        <li key={index} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <span className="text-sm font-medium text-gray-700 truncate mr-4">
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => handleRemoveFile(file)}
            className="text-red-500 hover:text-red-700 transition duration-150 p-1 rounded-full hover:bg-red-50"
            title={`Remove ${file.name}`}
          >
            {/* Trash Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </li>
      ))}
    </ul>
  ), [selectedFiles, handleRemoveFile]);

  return (
    <div className="space-y-3">
      {/* Hidden Native Input */}
      <input
        type="file"
        ref={fileInputRef}
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden" // Hide the standard file input
      />

      {/* Custom Button Trigger */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isMaxFilesReached}
        className={`w-full py-3 px-4 border-2 border-dashed rounded-lg transition duration-200 
                    ${isMaxFilesReached 
                        ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                        : 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100 hover:border-blue-500 hover:shadow-md'
                    }
                    flex items-center justify-center space-x-2 font-semibold text-sm`}
        title={isMaxFilesReached ? `Maximum ${maxFiles} files selected` : `Click to select photos (Max ${maxFiles})`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        <span>{isMaxFilesReached ? `Maximum ${maxFiles} Photos Selected` : `Upload Photos (Max ${maxFiles})`}</span>
      </button>
      
      {/* Error Message Display */}
      {errorMessage && (
        <p className="text-sm text-red-600 p-2 bg-red-50 border-l-4 border-red-400 rounded-r-md">
          {errorMessage}
        </p>
      )}

      {/* Selected File List */}
      {selectedFiles.length > 0 && (
        <div className="pt-2">
            <p className="text-sm font-medium text-gray-700 mb-1">
                {selectedFiles.length} File(s) Ready for Upload:
            </p>
            {fileListDisplay}
        </div>
      )}
    </div>
  );
};

export default FileInput;