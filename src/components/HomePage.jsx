import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRocket,
  FaClock,
  FaChartLine,
  FaDollarSign,
  FaSlack,
  FaHubspot,
  FaSalesforce,
  FaGoogle,
  FaMicrosoft,
  FaJira,
  FaInstagram,
  FaTwitter,
  FaFacebookF,
} from "react-icons/fa";
import { StarBorder } from "./ui/star-border";
import FadeInSection from "./FadeInSection";
import InfiniteScroll from "./ui/InfiniteScroll";
import TestimonialCard from "./ui/TestimonialCard";
import PricingCard from "./ui/PricingCard";
import IntegrationCard from "./ui/IntegrationCard";
import LightRays from "./ui/LightRays";
import SimpleLightRays from "./ui/SimpleLightRays";
import { navigateToCreate } from "../utils/navigation";
import SpotlightCard from "./ui/SpotlightCard";
import InfiniteBadges from "./ui/InfiniteBadges";
import { Edit2, Eye, Pointer, Upload, User2 } from "lucide-react";
import RadarScanner from "./ui/RadarScanner";
import { useIsMobile } from "../hooks/useIsMobile";
import { AIChatWidget } from "./AIChatWidget";

const HomePage = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile(); // Detect mobile to disable heavy animations

  // Check authentication state on home page load
  useEffect(() => {
    const checkAuthState = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const user = localStorage.getItem("user");

      if (accessToken && refreshToken && user) {
        setIsLoggedIn(true);
        try {
          const userData = JSON.parse(user);
          setUserEmail(userData.email || "");
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      } else {
        setIsLoggedIn(false);
        setUserEmail("");
      }
    };

    checkAuthState();
    const handleStorageChange = (e) => {
      if (
        e.key === "accessToken" ||
        e.key === "refreshToken" ||
        e.key === "user"
      ) {
        checkAuthState();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  // Scroll to section handler
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Testimonials data
  const testimonials = [
    {
      name: "Wayne",
      role: "Sales Operations",
      company: "",
      rating: 5,
      image:
        "https://framerusercontent.com/images/ETgoVdeITLLIYCHTFNeVuZDMyQY.png?width=1024&height=1024",
      testimonial:
        "SaaS companies are in great need of this product. Customers can get immediate answers and thus helps in decision making.",
    },
    {
      name: "Corvin Wucher",
      role: "Marketing Strategy",
      company: "",
      rating: 5,
      image:
        "https://framerusercontent.com/images/QmmaDSjXyuZNNDsZdt23lDVXI.png?width=512&height=512",
      testimonial:
        "We've all been there watching a 20-minute demo hoping they'll address your specific use case, only to sit through stuff that doesn't apply to you.",
    },
    {
      name: "Tuba Ismail",
      role: "Sales Manager",
      company: "",
      rating: 4.8,
      image:
        "https://framerusercontent.com/images/0zuVQ2JmvxEtdnpdOq5FtRJxmNY.png?width=382&height=512",
      testimonial:
        "Qudemo’s interactive agentic approach is a huge step forward. Answering questions instantly and jumping to the right video moment is a major upgrade over traditional demos.",
    },
    {
      name: "Abhilash Sathyan",
      role: "CEO - Rateup",
      company: "",
      rating: 5,
      image:
        "https://framerusercontent.com/images/4EiFhjIPXbRF4y7hS6k9U484AQM.jpg?width=3456&height=4028",
      testimonial:
        "Qudemo made our website feel personal, visitors get answers instantly and qualified leads have doubled!",
    },
    {
      name: "Dilshad",
      role: "CEO - Dgymbook",
      company: "",
      rating: 5,
      image:
        "https://framerusercontent.com/images/7qBFv2WmuOwj4qUFS7XUzQSFL4.jpg?width=3265&height=4898",
      testimonial:
        "Qudemo's AI video agent engages every visitor like a founder would. It saves our team so much time.",
    },
    {
      name: "John Mathew",
      role: "Product Marketing Lead",
      company: "",
      rating: 5,
      image:
        "https://framerusercontent.com/images/tvip64h9JcqV1xA68gzm2QrLSM.png?width=2048&height=2048",
      testimonial:
        "Setting up Qudemo was fast, and our demo conversions has increased. Visitors love interacting with it!",
    },
  ];

  // Integrations data
  const integrations = [
    { name: "Slack", icon: FaSlack, description: "Get notifications" },
    {
      name: "HubSpot",
      icon: FaHubspot,
      description: "Sync leads",
      comingSoon: true,
    },
    {
      name: "Salesforce",
      icon: FaSalesforce,
      description: "CRM integration",
      comingSoon: true,
    },
    { name: "Google Analytics", icon: FaGoogle, description: "Track insights" },
    {
      name: "Microsoft Teams",
      icon: FaMicrosoft,
      description: "Team alerts",
      comingSoon: true,
    },
    {
      name: "Jira",
      icon: FaJira,
      description: "Issue tracking",
      comingSoon: true,
    },
  ];

  return (
    <div className="h-full w-full flex flex-col relative bg-black">
      {/* Radial gradient overlays for depth - hidden on mobile */}
      {!isMobile && (
        <>
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] opacity-30"
            style={{
              background:
                "radial-gradient(circle at center top, rgba(41, 52, 255, 0.15) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute top-1/3 left-1/4 w-[600px] h-[600px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
              filter: "blur(100px)",
            }}
          />
          <div
            className="absolute top-2/3 right-1/4 w-[600px] h-[600px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
              filter: "blur(100px)",
            }}
          />
        </>
      )}

      {/* Left and Right side darkness gradients - hidden on mobile */}
      {!isMobile && (
        <>
          <div
            className="fixed left-0 top-0 bottom-0 w-1/3 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 50%, transparent 100%)",
              zIndex: 1,
            }}
          />
          <div
            className="fixed right-0 top-0 bottom-0 w-1/3 pointer-events-none"
            style={{
              background:
                "linear-gradient(-90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 50%, transparent 100%)",
              zIndex: 1,
            }}
          />
        </>
      )}

      {/* Enhanced Navigation Bar - Outside overflow container */}
      <nav
        className="w-full fixed top-0 z-[999]"
        style={{
          background: isMobile
            ? "rgba(0, 0, 0, 0.95)"
            : "linear-gradient(180deg, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) -50%, rgba(0, 0, 0, 0) 170.00000000000003%)",
          backdropFilter: isMobile ? "none" : "blur(5px)",
        }}
      >
        <div className="flex justify-between items-center max-w-7xl w-full mx-auto p-4 px-4 sm:px-6 md:px-8">
          <div className="flex items-center">
            <img
              src="/Qudemo LP.svg"
              alt="Qudemo Logo"
              className="cursor-pointer w-auto h-6 sm:h-7 md:h-8 scale-[2.5] sm:scale-[3] md:scale-[3.5] ml-1 sm:ml-2 md:ml-2.5"
              height={36}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />
          </div>

          {/* Navigation Links - Hidden on mobile */}
         <div className="hidden md:flex items-center gap-8 text-gray-500">
            {/* <button
              onClick={() => scrollToSection("pricing")}
              className="hover:text-blue-400 transition-colors duration-200 font-thin"
            >
              Pricing
            </button> */}
            <button
              onClick={() => window.open('https://cal.com/jazeem-choori-7jbaio/qudemo-intro', '_blank')}
              className="text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden group"
              style={{
                background: "rgba(59, 130, 246, 1)",
                boxShadow: "0 8px 32px rgba(59, 130, 246, 0.5)",
              }}
            >
              <span className="relative z-10">Talk to Us</span>
            </button>
          </div>

          {/* Auth Buttons */}
          {/* 
  // AUTH + DASHBOARD BUTTONS REMOVED FOR NOW
          {isLoggedIn && (
            <div className="flex items-center gap-2 md:gap-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div
                  onClick={() => navigate("/profile")}
                  className="text-white font-medium px-3 md:px-6 py-2 rounded-[20px] border text-xs md:text-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                  style={{
                    background: isMobile ? "rgba(18, 20, 38, 0.95)" : "rgba(18, 20, 38, 0.6)",
                    backdropFilter: isMobile ? "none" : "blur(16px)",
                    borderColor: "rgba(138, 165, 255, 0.3)",
                    boxShadow: "0 4px 24px rgba(41, 52, 255, 0.1)",
                  }}
                >
                  <span className="hidden sm:inline">{userEmail}</span>
                  <span className="sm:hidden">{userEmail.split("@")[0]}</span>
                </div>
                <div
                  onClick={() => navigate("/overview")}
                  className="text-white font-medium px-4 md:px-8 py-2 rounded-[20px] border hover:shadow-2xl transition-all duration-300 cursor-pointer text-sm md:text-base"
                  style={{
                    background: "rgba(41, 52, 255, 0.9)",
                    backdropFilter: isMobile ? "none" : "blur(16px)",
                    borderColor: "rgba(138, 165, 255, 0.5)",
                    boxShadow:
                      "0 8px 32px rgba(41, 52, 255, 0.4), inset 0 2px 4px rgba(138, 165, 255, 0.5)",
                  }}
                >
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Dash</span>
                </div>
              </div>
            </div>
          )}
            */}
        </div>
      </nav>

      <div
        className="relative z-50 flex flex-col min-h-screen max-w-full"
        style={{ overflowX: "clip" }}
      >
        {/* Hero Section */}
        <FadeInSection delay={0} className="flex flex-col z-[999]" disableAnimation={isMobile}>
          <div
            className="flex justify-center flex-col items-center pt-32 sm:pt-40 md:pt-48 lg:pt-60 px-4 sm:px-6 md:px-8 relative"
            style={{
              background:
                "radial-gradient(80% 25% at 50% 7.5%,var(--token-c6d9a740-f8af-44c7-ac7a-31b27a79b7f2,#000e47)0%,var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490,#000)100%)",
            }}
          >
            {!isMobile && (
              <div className="absolute top-0 left-0 right-0 w-full h-[100vh] bottom-0 opacity-[0.2] z-50">
                <SimpleLightRays />
              </div>
            )}
            <img
              decoding="auto"
              width="513"
              height="272"
              sizes="100vw"
              srcset="https://framerusercontent.com/images/eVPQSYBoVqwchmpN78sjyYtovY.svg?scale-down-to=512&amp;width=513&amp;height=272 512w,https://framerusercontent.com/images/eVPQSYBoVqwchmpN78sjyYtovY.svg?width=513&amp;height=272 513w"
              src="https://framerusercontent.com/images/eVPQSYBoVqwchmpN78sjyYtovY.svg?width=513&amp;height=272"
              alt="Grid"
              className="absolute top-0"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                borderRadius: "inherit",
                objectPosition: "center center",
                objectFit: "cover",
              }}
            />
            {/* Bottom right gradient overlay - hidden on mobile */}
            {!isMobile && (
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 90% 100%, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.7) 30%, transparent 60%)",
                }}
              />
            )}
            <div className="max-w-5xl text-center relative z-50">
              {/* User Avatars Badge */}
              <div className={`flex justify-center mb-4 sm:mb-6 ${isMobile ? '' : 'animate-fadeIn'}`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Avatar Stack */}
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                      <img
                        src="https://framerusercontent.com/images/ETgoVdeITLLIYCHTFNeVuZDMyQY.png"
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500">
                      <img
                        src="https://framerusercontent.com/images/bnJJiW5Vfixlrz7M2pzoeyHBU.png"
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-emerald-500">
                      <img
                        src="https://framerusercontent.com/images/rlizSNVuxrrqd6I5hGaSxwqn0Os.png"
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-red-500">
                      <img
                        src="https://framerusercontent.com/images/X0pqhTmlK8gdYqPbljhuLXlyd0I.png"
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  {/* Join Text */}
                  <span className="text-gray-500 text-xs sm:text-sm md:text-md font-normal">
                    Join <span className="text-white font-medium">200+</span>{" "}
                    other loving customers
                  </span>
                </div>
              </div>

              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium text-white mb-4 sm:mb-6 leading-tight tracking-tight px-2 sm:px-4"
                style={{
                  animation: isMobile ? "none" : "fadeInUp 0.8s ease-out 0.2s both",
                  textShadow: "0 4px 24px rgba(41, 52, 255, 0.3)",
                }}
              >
                Clone your best employee.
                <br />
            
              </h1>

              <p
                className="text-sm sm:text-base md:text-lg text-gray-500 my-6 sm:my-8 max-w-2xl mx-auto leading-relaxed font-normal px-4 sm:px-6"
                style={{
                  fontSize: "25px",
                  animation: isMobile ? "none" : "fadeInUp 0.8s ease-out 0.4s both",
                  fontWeight: "400",
                }}
              >
              Qudemo creates AI video call agents that feel like your best employee is always available.
              </p>

              {/* CTA Button */}
              <div
                className="flex items-center justify-center"
                style={{
                  animation: isMobile ? "none" : "fadeInUp 0.8s ease-out 0.5s both",
                }}
              >
                <button
                  onClick={() => window.QudemoWidget?.open()}
                  className="text-white font-medium text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden group z-[999]"
                  style={{
                    background: "rgba(59, 130, 246, 1)",
                    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.5)",
                  }}
                >
                  <span className="relative z-10">Book a Demo</span>
                </button>
              </div>

              {/* Infinite Scrolling Logos - COMMENTED OUT */}
            </div>
            {/*<div
              style={{
                animation: isMobile ? "none" : "fadeInUp 0.8s ease-out 0.6s both",
              }}
            >
              <InfiniteScroll />
            </div>*/}
          </div>
        </FadeInSection>

        {/* Why Choose Us Section */}
        <FadeInSection delay={0.1} className="flex flex-col relative" disableAnimation={isMobile}>
          <div
            className={`w-full h- relative overflow-hidden z-50 ${isMobile ? '' : 'bg-black/20'}`}
            style={{
              backdropFilter: isMobile ? "none" : "blur(100%)",
            }}
          >
            {/* Single horizontal glow line separator - hidden on mobile */}
            <div
              className="absolute top-0 left-0 right-0 h-px hidden md:block"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(100, 150, 255, 0.2) 20%, rgba(150, 180, 255, 0.3) 50%, rgba(100, 150, 255, 0.2) 80%, transparent 100%)",
              }}
            />
          </div>
         {/* <div
            className="sm:px-6 md:px-8 py-20 sm:py-32 md:py-40 relative my-auto flex flex-col justify-center overflow-hidden"
            id="benefits"
          >
            {!isMobile && (
              <div className="absolute top-0 left-0 right-0 w-full h-[100vh] bottom-0 opacity-[0.2] z-50">
                <LightRays
                  lightSpread={200}
                  rayLength={20}
                  raysColor="8aa5ff"
                  rotationSpeed={0.02}
                  fadeDistance={20}
                  numRays={8}
                  raysSpeed={1.0}
                />
              </div>
            )}
            <div className="w-full max-w-7xl mx-auto text-center flex flex-col px-4 sm:px-0">
              {!isMobile && (
                <div
                  style={{
                    width: "100%",
                    height: "600px",
                    position: "absolute",
                    top: "16%",
                    left: 0,
                    right: 0,
                    opacity: 0.6,
                  }}
                >
                  <RadarScanner
                    gridColor={[0.3, 0.5, 1.0]}
                    scanColor={[0, 0, 1.0]}
                    glowColor={[0, 0.5, 1.0]}
                    scanSpeed={0.6}
                  />
                </div>
              )}

              Bottom glowing light effect - hidden on mobile
              {!isMobile && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32"
                  style={{
                    background:
                      "radial-gradient(ellipse 800px 150px at center bottom, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 25%, rgba(255, 255, 255, 0.03) 50%, transparent 70%)",
                    filter: "blur(40px)",
                  }}
                />
              )}

              <div className="flex justify-center">
                <StarBorder
                  color="#2934ff"
                  className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wide"
                >
                  AI-DRIVEN EFFICIENCY
                </StarBorder>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-tight mt-6 sm:mt-8 mb-3 sm:mb-4">
                Create Qudemo in Minutes
              </h2>

              <p className="text-sm sm:text-base md:text-md text-gray-500 mb-8 sm:mb-12 max-w-4xl mx-auto">
                Three simple steps to launch your AI video agent
              </p>
              

              // Benefit Cards
            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 w-full">
                <SpotlightCard>
                  <div className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-black border border-blue-500/30">
                    // Corner accent 
                  
                    <div
                      className="absolute top-0 right-0 w-6 h-6 rounded-br-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, transparent 50%, rgba(59, 130, 246, 0.5) 50%)",
                        borderTopRightRadius: "0.75rem",
                      }}
                    />
                    <Upload className="text-blue-400 text-2xl relative z-10" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
                      Upload Content
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      Add your photo and key product knowledge sources. This
                      helps Qudemo learn how you explain your product in your
                      own words.
                    </p>
                  </div>
                </SpotlightCard>

                <SpotlightCard>
                  <div className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-black border border-blue-500/30">
                    
                  //Corner accent 
                    
                    <div
                      className="absolute top-0 right-0 w-6 h-6 rounded-br-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, transparent 50%, rgba(59, 130, 246, 0.5) 50%)",
                        borderTopRightRadius: "0.75rem",
                      }}
                    />
                    <Edit2 className="text-blue-400 text-2xl relative z-10" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
                      Generate Video Agent
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      Qudemo creates your AI video agent that talks and answers
                      like you and ready to engage website visitors with
                      real-time responses.
                    </p>
                  </div>
                </SpotlightCard>

                <SpotlightCard>
                  <div className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-black border border-blue-500/30">
                    //Corner accent 
                    <div
                      className="absolute top-0 right-0 w-6 h-6 rounded-br-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, transparent 50%, rgba(59, 130, 246, 0.5) 50%)",
                        borderTopRightRadius: "0.75rem",
                      }}
                    />
                    <FaChartLine className="text-blue-400 text-2xl relative z-10" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
                      Add to Website
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      Embed it on your site and start engaging visitors
                      instantly. Your AI video agent becomes the face of your
                      product, available 24/7.
                    </p>
                  </div>
                </SpotlightCard>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-10 text-gray-300 items-start sm:items-center mx-auto text-sm sm:text-base px-4">
                <div className="flex gap-3 sm:gap-4">
                  <Pointer className="text-blue-400" size={18} />
                  <p>Instant Engagement</p>
                </div>
                <div className="hidden sm:block w-[2px] h-6 bg-gray-600" />
                <div className="flex gap-3 sm:gap-4">
                  <User2 className="text-blue-400" size={18} />
                  <p>Qualified Leads</p>
                </div>
                <div className="hidden sm:block w-[2px] h-6 bg-gray-600" />
                <div className="flex gap-3 sm:gap-4">
                  <Eye className="text-blue-400" size={18} />
                  <p>Founder Experience</p>
                </div>
              </div>
            </div>
          </div>*/}

          <div
            className="sm:px-6 md:px-8 py-20 sm:py-32 md:py-40 relative overflow-x-hidden flex flex-col justify-center"
            id="why"
          >
            <div
              className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px hidden md:block"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(100, 150, 255, 0.2) 30%, rgba(150, 180, 255, 0.2) 50%, rgba(100, 150, 255, 0.2) 70%, transparent 100%)",
              }}
            />
            {/* Bottom glowing light effect - hidden on mobile */}
            {!isMobile && (
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32"
                style={{
                  background:
                    "radial-gradient(ellipse 800px 150px at center bottom, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 25%, rgba(255, 255, 255, 0.03) 50%, transparent 70%)",
                  filter: "blur(40px)",
                }}
              />
            )}
            <div className="w-full max-w-7xl mx-auto text-center flex flex-col px-4 sm:px-0">
              <div className="flex justify-center mb-6 sm:mb-8">
                <StarBorder
                  color="#2934ff"
                  className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wide"
                >
                  Use Cases
                </StarBorder>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-3 sm:mb-4 leading-tight">
              Powerful Ways to Use Qudemo
              </h2>

              <p className="text-sm sm:text-base md:text-md text-gray-500 mb-6 sm:mb-8 max-w-4xl mx-auto">
                Create a personalized 24x7 expert for your customers and team.
              </p>

              {/* Benefit Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 w-full">
                <SpotlightCard>
                  <div className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-black border border-blue-500/30">
                    {/* Corner accent */}
                    <div
                      className="absolute top-0 right-0 w-6 h-6 rounded-br-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, transparent 50%, rgba(59, 130, 246, 0.5) 50%)",
                        borderTopRightRadius: "0.75rem",
                      }}
                    />
                    <FaClock className="text-blue-400 text-2xl relative z-10" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
                    Instant Product Demo 
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                    Show website visitors a quick, interactive demo and answer their questions in real time so they understand your product faster.

                    </p>
                  </div>
                </SpotlightCard>

                <SpotlightCard>
                  <div className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-black border border-blue-500/30">
                    {/* Corner accent */}
                    <div
                      className="absolute top-0 right-0 w-6 h-6 rounded-br-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, transparent 50%, rgba(59, 130, 246, 0.5) 50%)",
                        borderTopRightRadius: "0.75rem",
                      }}
                    />
                    <FaChartLine className="text-blue-400 text-2xl relative z-10" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
                      Smart Onboarding
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                    Guide new customers or employees through clear steps and explain key features with simple, real-time answers.
            
                    </p>
                  </div>
                </SpotlightCard>

                <SpotlightCard>
                  <div className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-black border border-blue-500/30">
                    {/* Corner accent */}
                    <div
                      className="absolute top-0 right-0 w-6 h-6 rounded-br-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, transparent 50%, rgba(59, 130, 246, 0.5) 50%)",
                        borderTopRightRadius: "0.75rem",
                      }}
                    />
                    <FaDollarSign className="text-blue-400 text-2xl relative z-10" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
                    Interactive Training
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                    Train customers or internal teams with easy walkthroughs and instant responses that help them learn at their own pace.
                    </p>
                  </div>
                </SpotlightCard>
              </div>
              <div
                className="mt-12 md:mt-0"
                style={{
                  animation: isMobile ? "none" : "fadeInUp 0.8s ease-out 0.6s both",
                }}
              >
                <InfiniteBadges />
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Testimonials Section */}
        <FadeInSection delay={0.1} className="flex flex-col relative" disableAnimation={isMobile}>
          <div
            className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px hidden md:block"
            style={{
              background:
                "radial-gradient(63.671876482476385% 63.671876482476385% at 50.000000948784894% 50.000000948784894%, var(--token-6da9d50d-e927-4dcf-93ed-bf3b8039528b, rgb(138, 165, 255)) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) 100%)",
              opacity: 0.14,
            }}
          />
          <div
            className="absolute bottom-0 -translate-y-1/2 left-0 right-0 h-px hidden md:block"
            style={{
              background:
                "radial-gradient(63.671876482476385% 63.671876482476385% at 50.000000948784894% 50.000000948784894%, var(--token-6da9d50d-e927-4dcf-93ed-bf3b8039528b, rgb(138, 165, 255)) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) 100%)",
              opacity: 0.14,
            }}
          />
          <div
            className="px-4 sm:px-6 md:px-8 py-20 sm:py-32 md:py-40 flex flex-col my-auto justify-center overflow-hidden"
            id="testimonials"
            style={{
              background: isMobile ? "transparent" : "rgba(0, 0, 0, 0.6)",
            }}
          >
            {/* Dark overlay - hidden on mobile */}
            {!isMobile && (
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%)",
                }}
              />
            )}

            {/* Bottom glowing light effect - hidden on mobile */}
            {!isMobile && (
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32"
                style={{
                  background:
                    "radial-gradient(ellipse 800px 150px at center bottom, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 25%, rgba(255, 255, 255, 0.03) 50%, transparent 70%)",
                  filter: "blur(40px)",
                }}
              />
            )}
            <div className="max-w-7xl mx-auto text-center flex flex-col">
              <div className="flex justify-center mb-6 sm:mb-8 px-4">
                <StarBorder
                  color="#2934ff"
                  className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wide"
                >
                  TESTIMONIALS
                </StarBorder>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4 sm:mb-6 leading-tight px-4">
                Loved by thinkers
              </h2>

              <p className="text-sm sm:text-base md:text-md text-gray-500 mb-6 sm:mb-8 max-w-4xl mx-auto px-4">
                Real testimonials from people who have transformed their demos
                with Qudemo
              </p>

              {/* Testimonials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-4">
                {testimonials.map((testimonial, index) => (
                  <TestimonialCard key={index} {...testimonial} />
                ))}
              </div>
              <div className="flex items-center gap-3 mx-auto mt-8">
                {/* Avatar Stack */}
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                    <img
                      src="https://framerusercontent.com/images/ETgoVdeITLLIYCHTFNeVuZDMyQY.png"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500">
                    <img
                      src="https://framerusercontent.com/images/bnJJiW5Vfixlrz7M2pzoeyHBU.png"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-emerald-500">
                    <img
                      src="https://framerusercontent.com/images/rlizSNVuxrrqd6I5hGaSxwqn0Os.png"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-red-500">
                    <img
                      src="https://framerusercontent.com/images/X0pqhTmlK8gdYqPbljhuLXlyd0I.png"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {/* Join Text */}
                <span className="text-gray-500 text-md font-normal">
                  Join <span className="text-white font-medium">200+</span>{" "}
                  other loving customers
                </span>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Pricing Section */}
        {/*
        <FadeInSection delay={0.1} className="flex flex-col relative" disableAnimation={isMobile}>
          {!isMobile && (
            <div className="absolute top-0 left-0 right-0 w-full bottom-0 opacity-[0.2]">
              <LightRays
                lightSpread={200}
                rayLength={20}
                raysColor="8aa5ff"
                rotationSpeed={0.02}
                fadeDistance={20}
                numRays={8}
                raysSpeed={1.0}
              />
            </div>
          )}
          <div
            className="px-4 sm:px-6 md:px-8 w-full py-20 sm:py-32 md:py-40 flex flex-col my-auto justify-center overflow-hidden"
            id="pricing"
          >
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-72 z-1"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 50%, var(--token-e8bc8706-b247-48f0-95ed-879074c7f908, #121426) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, #000) 100%)",
                borderRadius: "10px",
                rotate: "-13deg",
              }}
            />
            <div className="max-w-7xl mx-auto w-full text-center">
              <div className="flex justify-center mb-6 sm:mb-8 px-4">
                <StarBorder
                  color="#2934ff"
                  className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wide"
                >
                  PRICING
                </StarBorder>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-3 sm:mb-4 leading-tight px-4">
                Flexible Pricing Plans
              </h2>

              <p className="text-sm sm:text-base md:text-md text-gray-500 mb-6 sm:mb-8 max-w-4xl mx-auto px-4">
                Choose a plan that fits your business needs and unlock the full
                potential of our platform
              </p>

              // Pricing Toggle - Monthly/Yearly 
              <div className="flex flex-col sm:flex-row items-center justify-center mb-8 sm:mb-12 gap-3 sm:gap-0 px-4">
                <div
                  className="inline-flex items-center gap-0 p-1.5 px-4 sm:px-10 rounded-full relative"
                  style={{
                    background: "rgba(20, 25, 55, 0.8)",
                    border: "1px solid rgba(71, 85, 165, 0.3)",
                  }}
                >
                  <button
                    onClick={() => setIsYearly(false)}
                    className={`px-4 sm:px-8 py-2 sm:py-3 font-medium rounded-full transition-all duration-300 text-sm sm:text-base relative z-10 ${
                      !isYearly
                        ? "text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Monthly
                  </button>

                  <div className="w-px h-6 sm:h-8 bg-gray-600 opacity-30 relative z-10"></div>

                  <button
                    onClick={() => setIsYearly(true)}
                    className={`px-4 sm:px-8 py-2 sm:py-3 font-medium rounded-full transition-all duration-300 text-sm sm:text-base relative z-10 ${
                      isYearly
                        ? "text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Yearly
                  </button>

                  <span
                    className="ml-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white rounded-full relative z-10"
                    style={{
                      background: "rgba(59, 130, 246, 0.9)",
                    }}
                  >
                    20% off
                  </span>

                  // Animated underline 
                  <div
                    className="absolute bottom-1 h-0.5 transition-all rounded duration-300 ease-out"
                    style={{
                      background: "rgba(59, 130, 246, 1)",
                      width: isYearly ? "180px" : "80px",
                      left: isYearly ? "calc(50% - 20px + 8px)" : "60px",
                      boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)",
                    }}
                  />
                </div>
              </div>

              // Pricing Cards 
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto z-50 px-2 sm:px-4">
                <PricingCard
                  title="Starter"
                  price={isYearly ? "417" : "500"}
                  period="month"
                  isPopular={true}
                  features={[
                    "1 Video Agent",
                    "3,000 interactions/month",
                    "Qualifies leads automatically",
                    "Basic engagement insights", 
                    "Quick no-code setup"
                  ]}
                />

                <PricingCard
                  title="Enterprise"
                  customPrice={true}
                  customPriceText="Let's Talk"
                  buttonText="Book a Demo"
                  onButtonClick={() => window.open('https://cal.com/jazeem-choori-7jbaio/qudemo-intro', '_blank')}
                  className="!overflow-visible"
                  features={[
                    "Everything in Starter",
                    "Multiple AI agents",
                    "Unlimited interactions/month",
    
            
                  ]}
                />
              </div>
            </div>
          </div>
        </FadeInSection>

        // Quote Section */}
        {/*
        <FadeInSection delay={0.1} className="flex flex-col !min-h-0 relative" disableAnimation={isMobile}>
          <div
            className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px hidden md:block"
            style={{
              background:
                "radial-gradient(63.671876482476385% 63.671876482476385% at 50.000000948784894% 50.000000948784894%, var(--token-6da9d50d-e927-4dcf-93ed-bf3b8039528b, rgb(138, 165, 255)) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) 100%)",
              opacity: 0.14,
            }}
          />
          <div
            className="absolute bottom-0 -translate-y-1/2 left-0 right-0 h-px hidden md:block"
            style={{
              background:
                "radial-gradient(63.671876482476385% 63.671876482476385% at 50.000000948784894% 50.000000948784894%, var(--token-6da9d50d-e927-4dcf-93ed-bf3b8039528b, rgb(138, 165, 255)) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) 100%)",
              opacity: 0.14,
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-72 z-1"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, var(--token-e8bc8706-b247-48f0-95ed-879074c7f908, #121426) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, #000) 100%)",
              borderRadius: "10px",
              rotate: "-13deg",
            }}
          />
          <div
            className="px-6 z-50 bg-transparent py-40 my-auto flex flex-col justify-center overflow-hidden"
            style={{
              borderColor: "rgba(138, 165, 255, 0.3)",
              boxShadow: "0 4px 24px rgba(41, 52, 255, 0.1)",
            }}
          >
            <div className="max-w-4xl mx-auto text-center flex flex-col">
              <div className="flex justify-center mb-8">
                <StarBorder
                  color="#2934ff"
                  className="text-blue-100 text-sm font-medium"
                >
                  FOUNDERS NOTE
                </StarBorder>
              </div>

              <blockquote className="text-3xl md:text-4xl font-normal text-white leading-relaxed">
                “We think demos should feel like the
                <br />
                founder is talking to every visitor. Qudemo
                <br />
                makes it happen instantly„
              </blockquote>

              <div className="flex items-center gap-3 text-left mx-auto mt-8">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                  <img
                    src="https://framerusercontent.com/images/81XI4Y9Evkk0bmbRaTAgilWrNc.jpeg?width=560&height=560"
                    alt="Founder"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-gray-400 text-base">
                    Co-founder & ex-Meta Data Scientist
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
*/}
        {/* Seamless Integrations Section - FULLY COMMENTED OUT */}
        {false && (
        <FadeInSection delay={0.1} className="relative" disableAnimation={isMobile}>
          {!isMobile && (
            <div className="absolute top-0 left-0 right-0 w-full bottom-0 opacity-[0.2] z-50">
              <LightRays
                lightSpread={200}
                rayLength={20}
                raysColor="8aa5ff"
                rotationSpeed={0.02}
                fadeDistance={20}
                numRays={8}
                raysSpeed={1.0}
              />
            </div>
          )}
          <div className="px-6 relative pt-40 -mb-36 flex items-center justify-center overflow-hidden">
            <div className="max-w-7xl mx-auto text-center relative w-full">
              {/* Badge */}
              <div className="flex justify-center mb-8">
                <StarBorder
                  color="#2934ff"
                  className="text-blue-100 text-sm font-medium"
                >
                  INTEGRATIONS
                </StarBorder>
              </div>

              <h2 className="text-3xl md:text-5xl font-medium text-white mb-6 leading-tight">
                Seamless integrations
              </h2>

              <p className="text-base font-light text-gray-500 mb-20 max-w-4xl mx-auto">
                Works with your existing stack — no complex setup required
              </p>

              {/* Integration Hub - Center Logo with Connecting Lines */}
              <div
                className="relative w-full mx-auto"
                style={{ height: "600px" }}
              >
                {/* Center Logo with Wave Animations */}
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  {/* Multiple Concentric Wave Circles - 3 waves - hidden on mobile */}
                  {!isMobile && [...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: "46px",
                        height: "46px",
                        background: `radial-gradient(circle, transparent 60%, rgba(59, 130, 246, ${0.4 - i * 0.05}) 70%, transparent 100%)`,
                        animation: `waveRipple 6s ease-out infinite`,
                        animationDelay: `${i * 1}s`,
                      }}
                    />
                  ))}

                  {/* Center Logo */}
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center relative z-10"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(37, 99, 235, 1) 100%)",
                      boxShadow:
                        "0 0 60px rgba(59, 130, 246, 0.6), 0 0 100px rgba(59, 130, 246, 0.4)",
                    }}
                  >
                    <img
                      src="/Qudemo LP.svg"
                      alt="Qudemo Logo"
                      className="w-20 h-20"
                    />
                  </div>
                </div>

                {/* Animated Lines and Bubbles */}
                {/* Top - OpenAI */}
                <div className="flex flex-wrap justify-center h-full">
                  <div className="basis-1/2">
                    <SpotlightCard
                      className="w-20 h-20 rounded-xl flex items-center justify-center m-auto"
                      style={{
                        background: isMobile ? "rgba(18, 20, 38, 0.95)" : "rgba(18, 20, 38, 0.8)",
                        backdropFilter: isMobile ? "none" : "blur(16px)",
                        border: "1px solid rgba(138, 165, 255, 0.3)",
                        boxShadow: "0 8px 32px rgba(41, 52, 255, 0.3)",
                      }}
                    >
                      <svg
                        className="w-10 h-10 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                      </svg>
                    </SpotlightCard>
                    <p className="text-gray-300 mt-4 text-sm max-w-[200px] mx-auto">
                      GPT models to generate content and build intelligent
                      agents.
                    </p>
                  </div>

                  {/* Right - Notion */}
                  <div className="basis-1/2">
                    <SpotlightCard
                      className="w-20 h-20 rounded-xl flex items-center justify-center m-auto"
                      style={{
                        background: isMobile ? "rgba(18, 20, 38, 0.95)" : "rgba(18, 20, 38, 0.8)",
                        backdropFilter: isMobile ? "none" : "blur(16px)",
                        border: "1px solid rgba(138, 165, 255, 0.3)",
                        boxShadow: "0 8px 32px rgba(41, 52, 255, 0.3)",
                      }}
                    >
                      <span className="text-4xl font-bold text-white">N</span>
                    </SpotlightCard>
                    <p className="text-gray-300 mt-4 text-sm max-w-[200px] mx-auto">
                      Summarize tasks, and organize info using Notion's powerful
                      AI assistant.
                    </p>
                  </div>

                  {/* Bottom - LinkedIn */}
                  <div className="basis-1/2">
                    <SpotlightCard
                      className="w-20 h-20 rounded-xl flex items-center justify-center m-auto"
                      style={{
                        background: isMobile ? "rgba(18, 20, 38, 0.95)" : "rgba(18, 20, 38, 0.8)",
                        backdropFilter: isMobile ? "none" : "blur(16px)",
                        border: "1px solid rgba(138, 165, 255, 0.3)",
                        boxShadow: "0 8px 32px rgba(41, 52, 255, 0.3)",
                      }}
                    >
                      <svg
                        className="w-10 h-10 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </SpotlightCard>
                    <p className="text-gray-300 mt-4 text-sm max-w-[200px] mx-auto">
                      Connect with Linked In and with dozens of other tools in
                      it
                    </p>
                  </div>

                  {/* Left - Twitter/X */}
                  <div className="basis-1/2">
                    <SpotlightCard
                      className="w-20 h-20 rounded-xl flex items-center justify-center m-auto"
                      style={{
                        background: isMobile ? "rgba(18, 20, 38, 0.95)" : "rgba(18, 20, 38, 0.8)",
                        backdropFilter: isMobile ? "none" : "blur(16px)",
                        border: "1px solid rgba(138, 165, 255, 0.3)",
                        boxShadow: "0 8px 32px rgba(41, 52, 255, 0.3)",
                      }}
                    >
                      <svg
                        className="w-10 h-10 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </SpotlightCard>
                    <p className="text-gray-300 mt-4 text-sm max-w-[200px] mx-auto">
                      Connect with Twitter and with dozens of other tools in it
                      without code
                    </p>
                  </div>
                </div>

                {/* Connecting Lines with Animated Line Beams - hidden on mobile */}
                {!isMobile && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 1 }}
                  >
                  {/* Vertical Line - Top */}
                  <line
                    x1="50%"
                    y1="40%"
                    x2="50%"
                    y2="0%"
                    stroke="rgba(59, 130, 246, 0.1)"
                    strokeWidth="2"
                  />

                  {/* Horizontal Line - Right */}
                  <line
                    x1="50%"
                    y1="40%"
                    x2="80%"
                    y2="40%"
                    stroke="rgba(59, 130, 246, 0.1)"
                    strokeWidth="2"
                  />

                  {/* Vertical Line - Bottom */}
                  <line
                    x1="50%"
                    y1="40%"
                    x2="50%"
                    y2="60%"
                    stroke="rgba(59, 130, 246, 0.1)"
                    strokeWidth="2"
                  />

                  {/* Horizontal Line - Left */}
                  <line
                    x1="50%"
                    y1="40%"
                    x2="20%"
                    y2="40%"
                    stroke="rgba(59, 130, 246, 0.1)"
                    strokeWidth="2"
                  />

                  {/* Animated Line Beams - Small moving line segments */}
                  {/* Beam to Top */}
                  <line
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="x1"
                      values="50%;50%"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y1"
                      values="40%;38%;36%;34%;32%;30%;28%;26%;24%;22%;20%;18%;16%;14%;12%;10%;8%;6%;4%;2%;0%"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="x2"
                      values="50%;50%"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y2"
                      values="38%;36%;34%;32%;30%;28%;26%;24%;22%;20%;18%;16%;14%;12%;10%;8%;6%;4%;2%;0%;0%"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.8;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;1;0.5;0"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </line>

                  {/* Beam to Right */}
                  <line
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="x1"
                      values="50%;52%;54%;56%;58%;60%;62%;64%;66%;68%;70%;72%;74%;76%;78%;80%"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y1"
                      values="40%;40%"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="x2"
                      values="52%;54%;56%;58%;60%;62%;64%;66%;68%;70%;72%;74%;76%;78%;80%;80%"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y2"
                      values="40%;40%"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.8;1;1;1;1;1;1;1;1;1;1;1;1;0.5;0"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </line>

                  {/* Beam to Bottom */}
                  <line
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="x1"
                      values="50%;50%"
                      dur="3.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y1"
                      values="40%;42%;44%;46%;48%;50%;52%;54%;56%;58%;60%"
                      dur="3.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="x2"
                      values="50%;50%"
                      dur="3.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y2"
                      values="42%;44%;46%;48%;50%;52%;54%;56%;58%;60%;60%"
                      dur="3.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.8;1;1;1;1;1;1;1;0.5;0"
                      dur="3.5s"
                      repeatCount="indefinite"
                    />
                  </line>

                  {/* Beam to Left */}
                  <line
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="x1"
                      values="50%;48%;46%;44%;42%;40%;38%;36%;34%;32%;30%;28%;26%;24%;22%;20%"
                      dur="4.8s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y1"
                      values="40%;40%"
                      dur="4.8s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="x2"
                      values="48%;46%;44%;42%;40%;38%;36%;34%;32%;30%;28%;26%;24%;22%;20%;20%"
                      dur="4.8s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y2"
                      values="40%;40%"
                      dur="4.8s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.8;1;1;1;1;1;1;1;1;1;1;1;1;0.5;0"
                      dur="4.8s"
                      repeatCount="indefinite"
                    />
                  </line>
                </svg>
                )}
              </div>
            </div>

            <style jsx>{`
              @keyframes beamPulse {
                0%,
                100% {
                  opacity: 0.2;
                }
                50% {
                  opacity: 0.6;
                }
              }

              @keyframes waveRipple {
                0% {
                  transform: translate(-50%, -50%) scale(1);
                  opacity: 0;
                }
                10% {
                  opacity: 0.8;
                }
                100% {
                  transform: translate(-50%, -50%) scale(6.25);
                  opacity: 0;
                }
              }
            `}</style>
          </div>
        </FadeInSection>
        )}

        {/* Comparison Section */}
        {/*
        <FadeInSection delay={0.1} className="relative" disableAnimation={isMobile}>
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-72 relative"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, var(--token-e8bc8706-b247-48f0-95ed-879074c7f908, #121426) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, #000) 100%)",
              zIndex: 1,
              borderRadius: "10px",
            }}
          >
            <div
              className="absolute top-1/2 bottom-0 -translate-y-1/2 left-0 right-0 h-px hidden md:block"
              style={{
                background:
                  "radial-gradient(63.671876482476385% 63.671876482476385% at 50.000000948784894% 50.000000948784894%, var(--token-6da9d50d-e927-4dcf-93ed-bf3b8039528b, rgb(138, 165, 255)) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) 100%)",
                opacity: 0.14,
              }}
            />
          </div>
          <div
            className="px-6 flex flex-col justify-center overflow-hidden"
            id="comparison"
            style={{
              background: isMobile ? "transparent" : "rgba(0, 0, 0, 0.7)",
            }}
          >
            <div className="max-w-7xl mx-auto text-center">
              // Badge - Commented Out
              <div className="flex justify-center mb-8">
                <StarBorder
                  color="#2934ff"
                  className="text-blue-100 text-sm font-medium"
                >
                  COMPARISON
                </StarBorder>
              </div>

              <h2 className="text-3xl md:text-5xl font-medium text-white mb-6 leading-tight">
                Why Qudemo Stands Out
              </h2>

              <p className="text-base font-light md:text-base text-gray-500 mb-16 max-w-4xl mx-auto">
                Unlike generic chatbots or static videos, Qudemo combines the
                best of both worlds
              </p>

              // Comparison Grid - Commented Out
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                // LanX/Qudemo Column - Commented Out 
                <div className="flex flex-col">
                  // Header - Above Card - Commented Out
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-2">
                      <img
                        src="/Qudemo LP.svg"
                        alt="Qudemo Logo"
                        className="h-24 scale-[1.4]"
                      />
                    </div>
                  </div>

                  <SpotlightCard>
                    // Features List 
                    <div className="space-y-6 text-left">
                      <div className="flex items-start gap-3">
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-300 text-lg leading-relaxed">
                          Feels like the founder personally talking
                        </span>
                      </div>

                      <div className="flex items-start gap-3 relative pt-4">
                        <div
                          className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(100, 150, 255, 0.2) 30%, rgba(150, 180, 255, 0.2) 50%, rgba(100, 150, 255, 0.2) 70%, transparent 100%)",
                          }}
                        />
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-300 text-lg leading-relaxed">
                          Answers questions in real time through the video
                        </span>
                      </div>

                      <div className="flex items-start gap-3 relative pt-4">
                        <div
                          className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(100, 150, 255, 0.2) 30%, rgba(150, 180, 255, 0.2) 50%, rgba(100, 150, 255, 0.2) 70%, transparent 100%)",
                          }}
                        />
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-300 text-lg leading-relaxed">
                          Engages visitors while explaining product visually
                        </span>
                      </div>

                      <div className="flex items-start gap-3 relative pt-4">
                        <div
                          className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(100, 150, 255, 0.2) 30%, rgba(150, 180, 255, 0.2) 50%, rgba(100, 150, 255, 0.2) 70%, transparent 100%)",
                          }}
                        />
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-300 text-lg leading-relaxed">
                          Qualifies leads automatically
                        </span>
                      </div>

                      <div className="flex items-start gap-3 relative pt-4">
                        <div
                          className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(100, 150, 255, 0.2) 30%, rgba(150, 180, 255, 0.2) 50%, rgba(100, 150, 255, 0.2) 70%, transparent 100%)",
                          }}
                        />
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-300 text-lg leading-relaxed">
                          Handles complex questions naturally
                        </span>
                      </div>
                    </div>
                  </SpotlightCard>
                </div>

                // Others Column - Commented Out
                <div className="flex flex-col">
                  // Header - Above Card - Commented Out
                  <div className="flex items-center justify-center mb-6 h-24">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-10 h-10 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      <span className="text-3xl font-bold text-gray-300">
                        Others
                      </span>
                    </div>
                  </div>

                  <SpotlightCard>
                    // Features List
                    <div className="space-y-6 text-left">
                      <div className="flex items-start gap-3 relative">
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="text-gray-500 text-lg leading-relaxed">
                          Generic, impersonal replies
                        </span>
                      </div>

                      <div className="flex items-start gap-3 relative pt-4">
                        <div
                          className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(100, 150, 255, 0.2) 30%, rgba(150, 180, 255, 0.2) 50%, rgba(100, 150, 255, 0.2) 70%, transparent 100%)",
                          }}
                        />
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="text-gray-500 text-lg leading-relaxed">
                          Limited to text/chat responses
                        </span>
                      </div>

                      <div className="flex items-start gap-3 relative pt-4">
                        <div
                          className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(100, 150, 255, 0.2) 30%, rgba(150, 180, 255, 0.2) 50%, rgba(100, 150, 255, 0.2) 70%, transparent 100%)",
                          }}
                        />
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="text-gray-500 text-lg leading-relaxed">
                          Often only provides text instructions
                        </span>
                      </div>

                      <div className="flex items-start gap-3 relative pt-4">
                        <div
                          className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(100, 150, 255, 0.2) 30%, rgba(150, 180, 255, 0.2) 50%, rgba(100, 150, 255, 0.2) 70%, transparent 100%)",
                          }}
                        />
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="text-gray-500 text-lg leading-relaxed">
                          Requires manual follow-up
                        </span>
                      </div>

                      <div className="flex items-start gap-3 relative pt-4">
                        <div
                          className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(100, 150, 255, 0.2) 30%, rgba(150, 180, 255, 0.2) 50%, rgba(100, 150, 255, 0.2) 70%, transparent 100%)",
                          }}
                        />
                        <svg
                          className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="text-gray-500 text-lg leading-relaxed">
                          Struggles with nuanced queries
                        </span>
                      </div>
                    </div>
                  </SpotlightCard>
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
*/}
        {/* FAQ Section */}
        {/*
        <FadeInSection delay={0.1} className="relative" disableAnimation={isMobile}>
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-72 relative"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, var(--token-e8bc8706-b247-48f0-95ed-879074c7f908, #121426) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, #000) 100%)",
              zIndex: 1,
              borderRadius: "10px",
            }}
          >
            <div
              className="absolute top-1/2 bottom-0 -translate-y-1/2 left-0 right-0 h-px hidden md:block"
              style={{
                background:
                  "radial-gradient(63.671876482476385% 63.671876482476385% at 50.000000948784894% 50.000000948784894%, var(--token-6da9d50d-e927-4dcf-93ed-bf3b8039528b, rgb(138, 165, 255)) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) 100%)",
                opacity: 0.14,
              }}
            />
          </div>
          <div
            className="px-4 sm:px-6 md:px-8 pb-20 sm:pb-32 md:pb-40 overflow-hidden"
            id="faq"
            style={{
              background: isMobile ? "transparent" : "rgba(0, 0, 0, 0.7)",
            }}
          >
            // Dark overlay - hidden on mobile 
            {!isMobile && (
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%)",
                }}
              />
            )}
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-6 sm:mb-8 px-4">
                <StarBorder
                  color="#2934ff"
                  className="text-blue-100 text-xs sm:text-sm font-medium"
                >
                  FAQ'S SECTION
                </StarBorder>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-mediumum text-white px-4">
                Some Common FAQ's
              </h2>

              <p className="text-sm sm:text-base font-light text-gray-500 my-3 sm:my-4 mb-8 sm:mb-10 px-4">
                Everything you need to know about getting started with Qudemo
              </p>

              // FAQ Items - Commented Out
              <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 px-2 sm:px-4">
                <SpotlightCard className="!p-0 !rounded-xl">
                  <div
                    className="flex justify-between items-center cursor-pointer p-4"
                    onClick={() => toggleFAQ(0)}
                  >
                    <h3 className="text-base font-thin text-white">
                      What is Qudemo?
                    </h3>
                    <svg
                      className={`w-5 h-5 text-white transform transition-transform duration-200 ${openFAQ === 0 ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {openFAQ === 0 && (
                    <div className="px-4 pb-6 text-gray-500 text-sm text-left">
                    Qudemo is an AI interactive video agent for SaaS websites. It lets visitors ask 
                    questions and get real-time answers directly from your product videos and documents. 
                    It feels like having the founder or product expert available 24/7 to explain things in a personal, engaging way.
                    </div>
                  )}
                </SpotlightCard>

                <SpotlightCard className="!p-0 !rounded-xl">
                  <div
                    className="flex justify-between items-center cursor-pointer p-4"
                    onClick={() => toggleFAQ(1)}
                  >
                    <h3 className="text-base font-thin text-white">
                      How does it work?
                    </h3>
                    <svg
                      className={`w-5 h-5 text-white transform transition-transform duration-200 ${openFAQ === 1 ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {openFAQ === 1 && (
                    <div className="px-4 pb-6 text-gray-500 text-sm text-left">
                    You upload your product video and connect your docs or help content. Qudemo’s AI learns from them and 
                    turns your static video into a smart, interactive one where visitors can ask questions and instantly 
                    get relevant answers—often with short video clips or clear text explanations.
                    </div>
                  )}
                </SpotlightCard>

                <SpotlightCard className="!p-0 !rounded-xl">
                  <div
                    className="flex justify-between items-center cursor-pointer p-4"
                    onClick={() => toggleFAQ(2)}
                  >
                    <h3 className="text-base font-thin text-white">
                      Who is it for?
                    </h3>
                    <svg
                      className={`w-5 h-5 text-white transform transition-transform duration-200 ${openFAQ === 2 ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {openFAQ === 2 && (
                    <div className="px-4 pb-6 text-gray-500 text-left">
                      B2B SaaS teams sharing pre-recorded product videos with
                      prospects.
                      <br />
                      <br />
                      Qudemo can also be used by startups, educators, learners
                      and anyone using demo or product videos to engage
                      customers.
                    </div>
                  )}
                </SpotlightCard>

                <SpotlightCard className="!p-0 !rounded-xl">
                  <div
                    className="flex justify-between items-center cursor-pointer p-4"
                    onClick={() => toggleFAQ(3)}
                  >
                    <h3 className="text-base font-thin text-white">
                      Do I need technical setup?
                    </h3>
                    <svg
                      className={`w-5 h-5 text-white transform transition-transform duration-200 ${openFAQ === 3 ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {openFAQ === 3 && (
                    <div className="px-4 pb-6 text-gray-500 text-left">
                     No, Qudemo is built for non-technical teams. 
                     You just upload your materials and copy-paste a small embed code on your site—no coding required.
                    </div>
                  )}
                </SpotlightCard>

                <SpotlightCard className="!p-0 !rounded-xl">
                  <div
                    className="flex justify-between items-center cursor-pointer p-4"
                    onClick={() => toggleFAQ(4)}
                  >
                    <h3 className="text-base font-thin text-white">
                      What's the benefit?
                    </h3>
                    <svg
                      className={`w-5 h-5 text-white transform transition-transform duration-200 ${openFAQ === 4 ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {openFAQ === 4 && (
                    <div className="px-4 pb-6 text-gray-500 text-left">
                     Companies using Qudemo see higher engagement on their product pages, more time 
                     spent on demos, and a noticeable increase in qualified leads booking calls..
                    </div>
                  )}
                </SpotlightCard>
              </div>
            </div>
          </div>
        </FadeInSection>
        */}

        {/* Final Call-to-Action Section */}
        <FadeInSection delay={0.1} className="min-h-[40vh]" disableAnimation={isMobile}>
          <div className="px-6 relative min-h-[40vh] flex flex-col justify-center">
            <div
              className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px hidden md:block"
              style={{
                background:
                  "radial-gradient(63.671876482476385% 63.671876482476385% at 50.000000948784894% 50.000000948784894%, var(--token-6da9d50d-e927-4dcf-93ed-bf3b8039528b, rgb(138, 165, 255)) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) 100%)",
                opacity: 0.14,
              }}
            />
            {!isMobile && (
              <div className="absolute top-0 left-0 right-0 w-full bottom-0 opacity-[0.2] z-50">
                <LightRays
                  lightSpread={200}
                  rayLength={20}
                  raysColor="8aa5ff"
                  rotationSpeed={0.02}
                  fadeDistance={20}
                  numRays={8}
                  raysSpeed={1.0}
                />
              </div>
            )}
            <div className="max-w-4xl mx-auto text-center relative">
              {/* Radial gradient glow - hidden on mobile */}
              {!isMobile && (
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(41, 52, 255, 0.3) 0%, transparent 70%)",
                    filter: "blur(60px)",
                  }}
                />
              )}

              <div className="relative z-50">
                <div className="flex justify-center mb-8">
                  <StarBorder
                    color="#1e40af"
                    className="text-blue-100 text-sm font-bold"
                  >
                    WHAT YOU STILL WAITING FOR
                  </StarBorder>
                </div>

                <h2 className="text-3xl md:text-5xl font-medium text-white leading-tight">
                  Grow Now with Qudemo
                </h2>

                <p className="text-base font-light text-gray-500 my-4 max-w-3xl mx-auto">
                  Create interactive video demos that engage prospects and{" "}
                  <br />
                  qualify leads automatically. Get started in minutes.
                </p>
              </div>
            </div>
          </div>
        </FadeInSection>

        <div
          className="py-10 px-6 bg-black relative"
          style={{
            background:
              "radial-gradient(83% 50% at 44% 111.5%, var(--token-c6d9a740-f8af-44c7-ac7a-31b27a79b7f2, rgb(0, 14, 71)) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) 100%)",
          }}
        >
          <div
            className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px hidden md:block"
            style={{
              background:
                "radial-gradient(63.671876482476385% 63.671876482476385% at 50.000000948784894% 50.000000948784894%, var(--token-6da9d50d-e927-4dcf-93ed-bf3b8039528b, rgb(138, 165, 255)) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) 100%)",
              opacity: 0.14,
            }}
          />
          <div className="max-w-7xl mx-auto">
            {/* Top Row - Logo and Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
              {/* Logo */}
              <div className="flex items-center">
                <img
                  src="/Qudemo LP.svg"
                  alt="LanX Logo"
                  className="h-40 -ml-5"
                />
              </div>

              {/* Navigation Links */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
               {/* <button
                  onClick={() => scrollToSection("pricing")}
                  className="hover:text-white transition-colors duration-200"
                >
                  Pricing
                </button>*/}
                <span className="text-gray-700">|</span>
                <button
                  onClick={() => scrollToSection("why")}
                  className="hover:text-white transition-colors duration-200"
                >
                  Benefits
                </button>
                <span className="text-gray-700">|</span>
                <a
                  href="mailto:mail@qudemo.com"
                  className="hover:text-white transition-colors duration-200"
                >
                  Contact
                </a>
                <span className="text-gray-700">|</span>
                <button className="hover:text-white transition-colors duration-200">
                  Blog
                </button>
                <span className="text-gray-700">|</span>
                <button
                  onClick={() => navigate("/privacypolicy")}
                  className="hover:text-white transition-colors duration-200"
                >
                  Privacy
                </button>
                <span className="text-gray-700">|</span>
                <a
                  href="mailto:mail@qudemo.com"
                  className="hover:text-white transition-colors duration-200"
                >
                  mail@qudemo.com
                </a>
              </div>
            </div>
          </div>
          <footer className="py-6 sm:py-8 px-4 sm:px-6 md:px-8 relative">
            <div
              className="absolute top-0 -translate-y-1/2 left-0 right-0 h-px"
              style={{
                background:
                  "radial-gradient(63.671876482476385% 63.671876482476385% at 50.000000948784894% 50.000000948784894%, var(--token-6da9d50d-e927-4dcf-93ed-bf3b8039528b, rgb(138, 165, 255)) 0%, var(--token-6d7bfc0f-867f-43f5-837b-f61a13bf9490, rgb(0, 0, 0)) 100%)",
                opacity: 0.14,
              }}
            />
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
                {/* Copyright */}
                <div className="text-gray-500 text-xs sm:text-sm text-center md:text-left">
                  © {new Date().getFullYear()} Qudemo. All rights reserved.
                </div>

                {/* Social Media Icons */}
                <div className="flex gap-3 sm:gap-4 items-center">
                  <a
                    href="https://x.com/qudemohq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  {/* <a
                    href="https://facebook.com/qudemo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg> */}
                  {/* </a> */}
                  <a
                    href="https://www.linkedin.com/company/qudemo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white transition-colors"
                    aria-label="Linkedin"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4.98 3.5A2.49 2.49 0 0 1 2.5 6 2.49 2.49 0 0 1 0 3.5 2.49 2.49 0 0 1 2.5 1a2.49 2.49 0 0 1 2.48 2.5zM.5 8h4v14h-4V8zm7.5 0h3.6v1.92h.05c.5-.91 1.7-1.92 3.5-1.92 3.73 0 4.4 2.4 4.4 5.55V22h-4v-6.5c0-1.56-.03-3.56-2.2-3.56-2.2 0-2.5 1.67-2.5 3.45V22h-4V8z" />
                    </svg>
                  </a>
                </div>

                {/* Links */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
                  <a
                    href="/privacypolicy"
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                  {/* <a
                    href="/terms"
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </a> */}
                  <a
                    href="mailto:support@qudemo.com"
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out both;
        }
      `}</style>

      {/* AI Chat Widget - Live Avatar */}
      <AIChatWidget />
    </div>
  );
};

export default HomePage;
