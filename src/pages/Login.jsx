import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authServices";
import { API_BASE_URL } from "../services/api";
import { IoStatsChart } from "react-icons/io5";
import { MdNotificationsActive, MdClose } from "react-icons/md";
import { RiDashboardFill } from "react-icons/ri";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  // Get redirect info from URL parameters
  const redirectFrom = searchParams.get("from");
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const showLoginRequiredMessage = [
    "notification",
    "protected",
    "email",
  ].includes(redirectFrom);
  const isTokenExpired = searchParams.get("expired") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  // Slideshow state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Array of background images - add your image paths here
  const backgroundImages = [
    "/1.webp",
    "/2.webp",
    "/3.webp",
    "/4.webp",
    "/5.webp",
  ];

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      console.log("✅ User already logged in, redirecting...");
      // If coming from notification, redirect to intended page
      const destination = redirectFrom ? redirectTo : "/dashboard";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectFrom, redirectTo]);

  // Slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % backgroundImages.length,
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  // Prewarm backend to reduce cold-start impact before first login request
  useEffect(() => {
    fetch(`${API_BASE_URL}/`, { method: "GET" }).catch(() => {
      // Ignore prewarm failure; normal login flow still works
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    console.log("🔐 TA-Client: Login attempt started");

    try {
      await login(email, password);
      // Redirect to intended page (from notification) or dashboard
      const destination = redirectFrom ? redirectTo : "/dashboard";
      navigate(destination);
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess(false);
    setResetLoading(true);

    try {
      await authService.sendPasswordResetEmail(resetEmail);
      setResetSuccess(true);
      setResetEmail("");

      // Auto close modal after 5 seconds
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSuccess(false);
      }, 5000);
    } catch (error) {
      setResetError(error.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetEmail("");
    setResetError("");
    setResetSuccess(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Left Section - Welcome Banner */}
      <div className="hidden md:flex md:w-full lg:w-1/2 bg-gradient-to-br from-blue-500 via-cyan-400 to-sky-500 relative overflow-hidden">
        {/* Background Slideshow */}
        <div className="absolute inset-0">
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
        </div>

        {/* Gradient Overlay - lebih soft dan biru */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/75 via-cyan-500/65 to-sky-600/70"></div>

        {/* Water droplets decoration overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
          <div
            className="absolute top-32 right-20 w-24 h-24 bg-cyan-200/15 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-200/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-40 right-1/3 w-28 h-28 bg-white/15 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>

        {/* Slideshow Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-8 md:p-12 text-white w-full">
          {/* Undip Logo */}
          <div className="mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-2xl p-3 md:p-4">
              <img
                src="/Undip.webp"
                alt="Logo Undip"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.parentElement.innerHTML =
                    '<span class="text-blue-600 font-bold text-lg md:text-2xl">UNDIP</span>';
                }}
              />
            </div>
          </div>

          {/* University Branding */}
          <div className="mb-8 text-center">
            <p className="text-sm md:text-base font-medium text-white/90 mb-2">
              Teknik Lingkungan
            </p>
            <p className="text-lg md:text-xl font-bold text-white drop-shadow-lg">
              Universitas Diponegoro
            </p>
          </div>

          {/* Divider */}
          <div className="w-20 h-1 bg-white/30 rounded-full mb-8"></div>

          {/* Welcome Text */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-center drop-shadow-lg">
            Welcome To
          </h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 md:mb-6 text-center drop-shadow-lg">
            IPAL Monitoring
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-center max-w-md text-white/90 leading-relaxed px-4">
            Monitor and manage your water quality in real-time with advanced
            analytics and intelligent alerts
          </p>

          {/* Decorative Elements */}
          <div className="mt-8 md:mt-12 flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2 md:mb-3 border border-white/30">
                <IoStatsChart className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <p className="text-xs md:text-sm font-medium">
                Data Visualization
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2 md:mb-3 border border-white/30">
                <MdNotificationsActive className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <p className="text-xs md:text-sm font-medium">Smart Alerts</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2 md:mb-3 border border-white/30">
                <RiDashboardFill className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <p className="text-xs md:text-sm font-medium">
                Notification System
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Waves */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
              fillOpacity="0.1"
            />
          </svg>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/40 min-h-screen lg:min-h-0">
        <div className="w-full max-w-lg">
          {/* Mobile Header - Only visible on small screens */}
          <div className="md:hidden text-center mb-6">
            {/* Undip Logo for Mobile */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <img
                  src="/logo-undip.png"
                  alt="Logo Undip"
                  className="w-14 h-14 object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div className="hidden text-blue-600 font-bold text-lg">
                  UNDIP
                </div>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              Teknik Lingkungan
            </p>
            <p className="text-sm font-bold text-gray-800 mb-3">
              Universitas Diponegoro
            </p>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              IPAL Monitoring System
            </h2>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-10 md:p-12 border border-white/50">
            {/* Notification Message Banner */}
            {showLoginRequiredMessage && (
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">
                      🔐 Login Required
                    </h4>
                    <p className="text-sm text-blue-700">
                      Please login to access the requested page. You will be
                      redirected after login.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Header - Horizontal Layout */}
            <div className="mb-8 md:mb-10">
              <div className="flex items-center gap-5 md:gap-6 mb-5">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-blue-200/50 p-5 md:p-6 transition-all hover:scale-105 hover:shadow-2xl hover:ring-blue-300/60">
                    <img
                      src="/LogoIPAL.png"
                      alt="Logo IPAL"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                {/* Text */}
                <div className="flex-1">
                  <h3 className="text-3xl md:text-4xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-2">
                    Sign In
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    Welcome back! Please enter your credentials
                  </p>
                </div>
              </div>
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-700 text-xs md:text-sm font-medium">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 md:h-6 md:w-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 md:pl-14 pr-4 py-3.5 md:py-4 text-base md:text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 md:h-6 md:w-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 md:pl-14 pr-12 md:pr-14 py-3.5 md:py-4 text-base md:text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5 md:h-6 md:w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 md:h-6 md:w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm md:text-base font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl py-4 md:py-4.5 text-base md:text-lg font-semibold shadow-lg transition-all duration-200 ${
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-xl hover:scale-[1.02] hover:from-blue-700 hover:to-cyan-600 active:scale-[0.98]"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 md:h-6 md:w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Copyright */}
          <p className="text-center text-xs text-gray-500 mt-4 md:mt-6">
            © 2025 IPAL Monitoring System - Teknik Lingkungan Undip
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Reset Password
              </h3>
              <button
                onClick={closeForgotModal}
                className="text-white/90 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {resetSuccess ? (
                // Success Message
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    Email Sent!
                  </h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Password reset instructions have been sent to:
                  </p>
                  <p className="text-sm font-semibold text-cyan-600 mb-4 break-all">
                    {resetEmail || "your email"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Please check your inbox and follow the instructions to reset
                    your password. The link will expire in 1 hour.
                  </p>
                </div>
              ) : (
                // Reset Form
                <>
                  <p className="text-sm text-gray-600 mb-6">
                    Enter your email address and we'll send you instructions to
                    reset your password.
                  </p>

                  {resetError && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <p className="text-sm text-red-700">{resetError}</p>
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword}>
                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                            />
                          </svg>
                        </div>
                        <input
                          type="email"
                          placeholder="your.email@example.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                          required
                          disabled={resetLoading}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeForgotModal}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        disabled={resetLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className={`flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl py-3 font-semibold shadow-lg transition-all duration-200 ${
                          resetLoading
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                      >
                        {resetLoading ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Sending...
                          </span>
                        ) : (
                          "Send Reset Link"
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
