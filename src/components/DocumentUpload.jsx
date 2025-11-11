import React, { useState, useEffect, useRef } from "react";
import { getNodeApiUrl } from "../config/api";
const DocumentUpload = ({
  qudemoId,
  companyName,
  onDocumentsChange,
  onSelectedFilesChange,
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const [documents, setDocuments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  // Update parent component when documents change
  useEffect(() => {
    if (onDocumentsChange) {
      onDocumentsChange(documents);
    }
  }, [documents, onDocumentsChange]);
  // Auto-upload files when qudemoId becomes available
  useEffect(() => {
    if (qudemoId && files.length > 0 && !uploading) {
      // Upload files sequentially to avoid overwhelming the server
      const autoUpload = async () => {
        setUploading(true);
        try {
          for (const fileObj of files) {
            if (uploadStatus[fileObj.id] === "ready") {
              await uploadFile(fileObj);
              // Small delay between uploads
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        } catch (error) {
        } finally {
          setUploading(false);
        }
      };
      autoUpload();
    }
  }, [qudemoId]); // Only depend on qudemoId to avoid infinite loops
  const handleFiles = (fileList) => {
    const selectedFiles = Array.from(fileList);
    const newFiles = selectedFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "ready",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setUploadStatus((prev) => {
      const newStatus = { ...prev };
      newFiles.forEach((fileObj) => {
        newStatus[fileObj.id] = "ready";
      });
      return newStatus;
    });
    // Notify parent about selected files
    if (onSelectedFilesChange) {
      const allFiles = [...files, ...newFiles];
      onSelectedFilesChange(allFiles);
    }
  };
  const handleFileChange = (e) => {
    handleFiles(e.target.files);
  };
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
    }
  };
  const removeFile = (fileId) => {
    setFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== fileId);
      // Notify parent about remaining files
      if (onSelectedFilesChange) {
        onSelectedFilesChange(newFiles);
      }
      return newFiles;
    });
    setUploadStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[fileId];
      return newStatus;
    });
  };
  const uploadFile = async (fileObj) => {
    if (!qudemoId || !companyName) {
      return;
    }
    const formData = new FormData();
    formData.append("file", fileObj.file);
    formData.append("qudemo_id", qudemoId);
    formData.append("company_name", companyName);
    try {
      setUploadStatus((prev) => ({ ...prev, [fileObj.id]: "uploading" }));
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        getNodeApiUrl(`/api/documents/${qudemoId}/upload`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );
      const data = await response.json();
      if (response.ok && data.success) {
        setUploadStatus((prev) => ({ ...prev, [fileObj.id]: "completed" }));
        // Add to documents list
        const newDocument = {
          id: data.document_id,
          filename: fileObj.name,
          size: fileObj.size,
          type: fileObj.type,
          upload_status: "processing",
          created_at: new Date().toISOString(),
        };
        setDocuments((prev) => [...prev, newDocument]);
        // Remove from files list after successful upload
        setTimeout(() => {
          setFiles((prev) => prev.filter((f) => f.id !== fileObj.id));
          setUploadStatus((prev) => {
            const newStatus = { ...prev };
            delete newStatus[fileObj.id];
            return newStatus;
          });
        }, 2000);
      } else {
        setUploadStatus((prev) => ({ ...prev, [fileObj.id]: "error" }));
      }
    } catch (error) {
      setUploadStatus((prev) => ({ ...prev, [fileObj.id]: "error" }));
    }
  };
  const uploadAllFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const fileObj of files) {
        if (uploadStatus[fileObj.id] === "ready") {
          await uploadFile(fileObj);
          // Small delay between uploads
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
    } finally {
      setUploading(false);
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "ready":
        return "📄";
      case "uploading":
        return "⏳";
      case "completed":
        return "✅";
      case "error":
        return "❌";
      default:
        return "📄";
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "ready":
        return "text-gray-600";
      case "uploading":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  return (
    <div className="space-y-4 dashboard-font">
      {/* Drag and Drop Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
          multiple
          className="hidden"
        />
        <div className="space-y-2">
          <div className="mx-auto w-10 h-10 text-blue-500">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800 mb-1">
              {dragActive ? "Drag & Drop Files Here" : "Click to upload files"}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop your PNG, JPG, WebP, SVG <br />
              images here or browse
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Choose Files
            </div>
            <p className="text-xs text-gray-500 mt-3">Supports: PDF only</p>
          </div>
        </div>
      </div>
      {/* Upload Button */}
      {files.length > 0 && qudemoId && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={uploadAllFiles}
            disabled={uploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {uploading ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Uploading...</span>
              </div>
            ) : (
              `Upload ${files.length} file${files.length === 1 ? "" : "s"}`
            )}
          </button>
        </div>
      )}
      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h5 className="font-medium text-gray-700 text-sm">Selected Files:</h5>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((fileObj) => (
              <div
                key={fileObj.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {getStatusIcon(uploadStatus[fileObj.id])}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {fileObj.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileObj.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {uploadStatus[fileObj.id] === "ready" && (
                    <button
                      type="button"
                      onClick={() => removeFile(fileObj.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                  {uploadStatus[fileObj.id] === "uploading" && (
                    <div className="flex items-center space-x-2">
                      <svg
                        className="animate-spin h-4 w-4 text-blue-600"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="text-xs text-blue-600">
                        Uploading...
                      </span>
                    </div>
                  )}
                  {uploadStatus[fileObj.id] === "completed" && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Uploaded
                    </span>
                  )}
                  {uploadStatus[fileObj.id] === "error" && (
                    <button
                      type="button"
                      onClick={() => uploadFile(fileObj)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h5 className="font-medium text-gray-700 text-sm">
            Uploaded Documents:
          </h5>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.size)} • {doc.upload_status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-4 w-4 text-green-600"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-xs text-green-600 font-medium">
                    Processing...
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default DocumentUpload;
