import React, { useState, useEffect } from "react";
import { useCompany } from "../context/CompanyContext";
import { getNodeApiUrl } from "../config/api";
const CompanyManagement = () => {
  const { refreshCompany } = useCompany();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    logo: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    fetchCompanies();
  }, []);
  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(getNodeApiUrl("/api/companies"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data);
      } else {
        setError(data.error || "Failed to fetch companies");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Company name must be at least 2 characters";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Company name must be less than 100 characters";
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "Website must be a valid URL";
    }
    if (formData.logo && !/^https?:\/\/.+/.test(formData.logo)) {
      newErrors.logo = "Logo must be a valid URL";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(getNodeApiUrl("/api/companies"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        // Reset form and close modal
        setFormData({
          name: "",
          description: "",
          website: "",
          logo: "",
        });
        setShowCreateForm(false);
        // Refresh companies list
        fetchCompanies();
        // Refresh company context
        refreshCompany();
      } else {
        setError(data.error || "Failed to create company");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteCompany = async (companyId) => {
    setError("");
    setDeleteTarget(null); // Close modal immediately
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        getNodeApiUrl(`/api/companies/${companyId}`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        // Show success message
        setError(""); // Clear any existing errors
        setSuccessMessage(data.message || "Company deleted successfully");
        // Refresh the companies list
        await fetchCompanies();
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
        // Show success notification (you can implement a toast notification here)
      } else {
        setError(data.error || "Failed to delete company");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Company Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Create Company
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white rounded-xl border p-6 flex flex-col items-center border border-gray-100 hover:shadow-2xl transition-shadow duration-200"
          >
            {/* Logo */}
            {company.logo && (
              <img
                src={company.logo}
                alt={company.name + " logo"}
                className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 shadow mb-4"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(company.name);
                }}
              />
            )}
            {/* Company Name and Status */}
            <div className="flex items-center justify-between w-full mb-2">
              <h3 className="text-xl font-bold text-gray-900 truncate">
                {company.name}
              </h3>
              <span
                className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${
                  company.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {company.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {/* Divider */}
            <div className="w-full border-b border-gray-200 my-2"></div>
            {/* Details */}
            <dl className="w-full space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Name:</dt>
                <dd className="text-gray-900">{company.name}</dd>
              </div>
              {company.description && (
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500">Description:</dt>
                  <dd className="text-gray-900 text-right max-w-[60%]">
                    {company.description}
                  </dd>
                </div>
              )}
              {company.website && (
                <div className="flex justify-between items-center">
                  <dt className="font-medium text-gray-500">Website:</dt>
                  <dd>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500 underline break-all"
                    >
                      {company.website}
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Created:</dt>
                <dd className="text-gray-900">
                  {new Date(company.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
            {/* Divider */}
            <div className="w-full border-b border-gray-200 my-4"></div>
            {/* Actions */}
            <div className="flex w-full justify-between space-x-2">
              <button
                onClick={() =>
                  window.open(`/api/video/${company.name}/process`, "_blank")
                }
                className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium py-2 rounded-lg transition-colors duration-150"
              >
                Video API
              </button>
              <button
                onClick={() =>
                  setDeleteTarget({
                    id: company.id,
                    name: company.name,
                    logo: company.logo,
                  })
                }
                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-medium py-2 rounded-lg transition-colors duration-150"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {companies.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-10 w-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No companies
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new company.
          </p>
        </div>
      )}
      {/* Create Company Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 border rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Company
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      formErrors.name ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="My Company (e.g., Acme Corp, settle.co)"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.name}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Enter your organization name. Spaces, dots, and special
                    characters are allowed.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Company description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      formErrors.website ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="https://example.com"
                  />
                  {formErrors.website && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.website}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Logo URL (optional)
                  </label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      formErrors.logo ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="https://example.com/logo.png"
                  />
                  {formErrors.logo && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.logo}
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating...." : "Create Company"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm mx-auto flex flex-col items-center relative animate-fade-in">
            {deleteTarget.logo && (
              <img
                src={deleteTarget.logo}
                alt={deleteTarget.display_name + " logo"}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow mb-4"
              />
            )}
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
              Delete Company
            </h3>
            <p className="text-gray-700 text-center mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget.display_name}</span>
              ?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ This action will permanently delete:</strong>
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• All video demos and transcripts</li>
                <li>• All knowledge sources and scraped data</li>
                <li>• All user interactions and questions</li>
                <li>• All company data from GCS</li>
                <li>• The company record itself</li>
              </ul>
              <p className="text-sm text-red-800 mt-2 font-semibold">
                This action cannot be undone!
              </p>
            </div>
            <div className="flex w-full space-x-3 mt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium py-2 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCompany(deleteTarget.id)}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 font-medium py-2 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CompanyManagement;
