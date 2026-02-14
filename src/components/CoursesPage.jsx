import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, ChevronRight } from "lucide-react";

// Typeform-style design tokens (Paper + Ink palette, Plus Jakarta Sans)
const TYPEFORM = {
  font: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  bg: "#FFFFFF",
  bgCard: "#FFFFFF",
  text: "#262627",
  textMuted: "#6B6B6B",
  accent: "#262627",
  border: "#E8E8E8",
  radius: "12px",
  radiusFull: "50px",
};

const getPreviewVideoUrl = (videoId) =>
  `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1`;
const getThumbnailUrl = (videoId) =>
  `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

const courses = [
  {
    id: "5g",
    title: "Introduction to 5G",
    description: "Learn about 5G technology, its capabilities, and real-world applications.",
    href: "/v2-avatar/5g?start=1",
    duration: "~15 min",
    videoId: "6ybdAVXo9x8",
  },
  {
    id: "qatar_history",
    title: "Introduction to Qatar History",
    description: "Explore Qatar's journey from geography and pearl diving to modern nationhood.",
    href: "/v2-avatar/qatar_history?start=1",
    duration: "~20 min",
    videoId: "5fXp_Mrsumc",
  },
  {
    id: "microwave",
    title: "Introduction to Microwave",
    description: "Understand microwave technology, waveguides, radar, and satellite communications.",
    href: "/v2-avatar/microwave?start=1",
    duration: "~15 min",
    videoId: "VQelI_lxu8Q",
  },
];

const CoursesPage = () => {
  const navigate = useNavigate();
  const [hoveredCourse, setHoveredCourse] = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: TYPEFORM.bg, fontFamily: TYPEFORM.font }}
    >
      {/* Top Navigation - Typeform style */}
      <header
        className="sticky top-0 z-50"
        style={{ backgroundColor: TYPEFORM.bgCard, borderBottom: `1px solid ${TYPEFORM.border}` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div
              className="flex items-center cursor-pointer gap-2"
              onClick={() => navigate("/")}
            >
              <img
                src="/Qudemo LP.svg"
                alt="Qudemo Logo"
                className="w-auto h-6 sm:h-7 md:h-8 scale-[2.5] sm:scale-[3] md:scale-[3.5] origin-left"
              />
            
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1
            className="text-3xl sm:text-4xl font-semibold mb-2 text-left"
            style={{ color: TYPEFORM.text }}
          >
            Develop skills that move your career forward
          </h1>
          <p
            className="text-lg max-w-2xl text-left"
            style={{ color: TYPEFORM.textMuted }}
          >
            Explore interactive AI-powered courses. Learn with your personal AI guide anytime, anywhere.
          </p>
        </motion.section>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-semibold"
            style={{ color: TYPEFORM.text }}
          >
            Featured Courses
          </h2>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
                onMouseEnter={() => setHoveredCourse(course.id)}
                onMouseLeave={() => setHoveredCourse(null)}
              >
                <Link to={course.href} className="block group">
                  <div
                    className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col"
                    style={{
                      backgroundColor: TYPEFORM.bgCard,
                      border: `1px solid ${TYPEFORM.border}`,
                      borderRadius: TYPEFORM.radius,
                    }}
                  >
                    {/* Thumbnail area - video preview on hover, first frame image otherwise */}
                    <div className="relative h-36 flex items-center justify-center overflow-hidden bg-gray-900">
                      {hoveredCourse === course.id ? (
                        <iframe
                          src={getPreviewVideoUrl(course.videoId)}
                          title={`${course.title} preview`}
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{
                            border: "none",
                            width: "100%",
                            height: "100%",
                            minWidth: "100%",
                            minHeight: "100%",
                          }}
                        />
                      ) : (
                        <img
                          src={getThumbnailUrl(course.videoId)}
                          alt={`${course.title} preview`}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://img.youtube.com/vi/${course.videoId}/hqdefault.jpg`;
                          }}
                        />
                      )}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white/90 text-xs font-medium bg-black/30 px-2 py-1 rounded z-10">
                        <PlayCircle className="w-3.5 h-3.5" />
                        {course.duration}
                      </div>
                    </div>

                    {/* Card content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3
                        className="text-base font-semibold mb-2 line-clamp-2 transition-colors"
                        style={{ color: TYPEFORM.text }}
                      >
                        {course.title}
                      </h3>
                      <p
                        className="text-sm line-clamp-2 flex-1 mb-4"
                        style={{ color: TYPEFORM.textMuted }}
                      >
                        {course.description}
                      </p>
                      <div
                        className="flex items-center font-medium text-sm group-hover:underline"
                        style={{ color: TYPEFORM.accent }}
                      >
                        Start course
                        <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
          ))}
        </div>

        {/* Bottom CTA section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 p-8 text-center rounded-lg"
          style={{
            backgroundColor: TYPEFORM.bgCard,
            border: `1px solid ${TYPEFORM.border}`,
            borderRadius: TYPEFORM.radius,
          }}
        >
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: TYPEFORM.text }}
          >
            Ready to learn?
          </h3>
          <p
            className="mb-4 max-w-xl mx-auto"
            style={{ color: TYPEFORM.textMuted }}
          >
            Each course features an AI guide that adapts to your pace. Click any course above to begin.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center px-6 py-2.5 text-white font-medium transition-colors"
            style={{
              backgroundColor: TYPEFORM.accent,
              borderRadius: TYPEFORM.radiusFull,
            }}
          >
            Back to Home
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default CoursesPage;
