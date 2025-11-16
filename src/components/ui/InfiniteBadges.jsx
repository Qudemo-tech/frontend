import React from "react";

const InfiniteBadges = ({ right = false }) => {
  // Logo items - you can replace these with your actual logo URLs

  const logos = [
    { name: "Customizable Plans", opacity: 0.4 },
    { name: "Smart Insights", opacity: 0.4 },
    { name: "Instant Savings", opacity: 0.7 },
    { name: "Flexible Payments", opacity: 0.4 },
    { name: "Customizable Plans", opacity: 0.5 },
    { name: "Smart Insights", opacity: 0.4 },
    { name: "Instant Savings", opacity: 0.4 },
    { name: "Customizable Plans", opacity: 0.4 },
    { name: "Smart Insights", opacity: 0.4 },
    { name: "Instant Savings", opacity: 0.7 },
    { name: "Flexible Payments", opacity: 0.4 },
    { name: "Customizable Plans", opacity: 0.5 },
    { name: "Smart Insights", opacity: 0.4 },
    { name: "Instant Savings", opacity: 0.4 },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="carousel-container max-w-5xl max-lg:max-w-4xl max-md:max-w-[360px] mx-auto w-full overflow-x-hidden relative">
        {/* Left fade overlay */}
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)",
          }}
        />
        {/* Right fade overlay */}
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(-90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)",
          }}
        />
        {/* Scrolling container with opacity mask */}
        <div className="carousel-group">
          {logos.map((logo, index) => (
            <div key={index} className="carousel-item">
              <p className="bg-grad rounded-full text-white/40 py-4 px-6 whitespace-nowrap">
                {logo.name}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="carousel-container max-w-5xl max-lg:max-w-4xl max-md:max-w-[360px] mx-auto w-full overflow-x-hidden relative">
        {/* Left fade overlay */}
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)",
          }}
        />
        {/* Right fade overlay */}
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(-90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 40%, transparent 100%)",
          }}
        />
        {/* Scrolling container with opacity mask */}
        <div className="carousel-group-right">
          {logos.map((logo, index) => (
            <div key={index} className="carousel-item">
              <p className="bg-grad rounded-full text-white/40 py-4 px-6 whitespace-nowrap">
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
