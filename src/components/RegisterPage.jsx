import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getNodeApiUrl } from "../config/api";
import { supabase } from "../config/supabase";
// import { navigateToOverview } from '../utils/navigation'; // Not used anymore
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // const navigate = useNavigate(); // Not used anymore
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await fetch(getNodeApiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        // Validate that we have the required data
        if (!data.data || !data.data.tokens || !data.data.user) {
          setRegisterError(
            "Registration successful but incomplete data received. Please try logging in.",
          );
          return;
        }
        // Store tokens (same as login flow)
        localStorage.setItem("accessToken", data.data.tokens.accessToken);
        localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        // Redirect to create page (not login) - will trigger company check
        const currentOrigin = window.location.origin;
        window.location.href = `${currentOrigin}/create`;
      } else {
        if (data.details && Array.isArray(data.details)) {
          setRegisterError(data.details.join(" "));
        } else {
          setRegisterError(data.error || "Registration failed");
        }
      }
    } catch (error) {
      setRegisterError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleSignUp = async () => {
    // Check if Supabase is properly configured
    const isUsingPlaceholders =
      !process.env.REACT_APP_SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL === "your-supabase-url" ||
      !process.env.REACT_APP_SUPABASE_ANON_KEY ||
      process.env.REACT_APP_SUPABASE_ANON_KEY === "your-supabase-anon-key-here";
    if (isUsingPlaceholders) {
      setRegisterError(
        "Google OAuth is not configured. Please set up Supabase credentials in .env file.",
      );
      return;
    }
    setIsGoogleLoading(true);
    setRegisterError("");
    try {
      // Clear any existing session and tokens before starting new OAuth
      const { clearAuthTokens } = await import("../utils/tokenRefresh");
      await clearAuthTokens();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setRegisterError(`Google sign-up failed: ${error.message}`);
      }
    } catch (error) {
      setRegisterError(`Google sign-up failed: ${error.message}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 -mt-32">
        <div>
          <div className="flex justify-center mb-0">
            <img src="/Qudemo.svg" alt="Qudemo Logo" className="w-72 h-48" />
          </div>
          <h2 className="-mt-8 text-center text-3xl font-semibold text-gray-900">
            Create a new account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              sign in to your account
            </Link>
          </p>
        </div>
        {/* Email/Password form hidden */}
        <div style={{ display: "none" }}>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <input
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs">{errors.firstName}</p>
              )}
              <input
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs">{errors.lastName}</p>
              )}
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
              />
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password}</p>
              )}
            </div>
            {registerError && (
              <p className="text-red-500 text-sm">{registerError}</p>
            )}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center h-10 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
          ) : (
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google"
              className="h-5 w-5 mr-2"
            />
          )}
          {isGoogleLoading ? "Signing up..." : "Sign up with Google"}
        </button>
      </div>
    </div>
  );
};
export default RegisterPage;
