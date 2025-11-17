import React from "react";

const InfiniteBadges = ({ right = false }) => {
  // Logo items - you can replace these with your actual logo URLs

  const logos = [
    { name: "Interactive Video", opacity: 0.4 },
    { name: "Founder Face", opacity: 0.4 },
    { name: "Real Time Answers", opacity: 0.7 },
    { name: "Visitor Engagement", opacity: 0.4 },
    { name: "Personalized Feel", opacity: 0.5 },
    { name: "Interactive Video", opacity: 0.4 },
    { name: "Founder Face", opacity: 0.4 },
    { name: "Real Time Answers", opacity: 0.4 },
    { name: "Visitor Engagement", opacity: 0.4 },
    { name: "Personalized Feel", opacity: 0.7 },
    { name: "Interactive Video", opacity: 0.4 },
    { name: "Founder Face", opacity: 0.5 },
    { name: "Real Time Answers", opacity: 0.4 },
    { name: "Personalized Feel", opacity: 0.4 },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-10">
      <div className="carousel-container max-w-5xl mx-auto w-full overflow-x-hidden relative">
        {/* Left fade overlay - hidden on mobile */}
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none hidden md:block"
          style={{
            background: "linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)",
          }}
        />
        {/* Right fade overlay - hidden on mobile */}
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none hidden md:block"
          style={{
            background: "linear-gradient(-90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)",
          }}
        />
        {/* Scrolling container with opacity mask */}
        <div className="carousel-group-badges">
          {logos.map((logo, index) => (
            <div key={index} className="carousel-item">
              <p className="bg-grad rounded-full text-white/40 py-2 sm:py-4 px-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm md:text-base">
                {logo.name}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="carousel-container max-w-5xl mx-auto w-full overflow-x-hidden relative">
        {/* Left fade overlay - hidden on mobile */}
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none hidden md:block"
          style={{
            background: "linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)",
          }}
        />
        {/* Right fade overlay - hidden on mobile */}
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none hidden md:block"
          style={{
            background: "linear-gradient(-90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)",
          }}
        />
        {/* Scrolling container with opacity mask */}
        <div className="carousel-group-badges-right">
          {logos.map((logo, index) => (
            <div key={index} className="carousel-item">
              <p className="bg-grad rounded-full text-white/40 py-2 sm:py-4 px-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm md:text-base">
                {logo.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfiniteBadges;
