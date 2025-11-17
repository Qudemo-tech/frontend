import React from "react";
import { FaCheck } from "react-icons/fa";
import SpotlightCard from "./SpotlightCard";

const PricingCard = ({
  title,
  price,
  period = "month",
  features,
  isPopular = false,
  buttonText,
  onButtonClick,
  customPrice = false,
  customPriceText = "Custom",
  className,
}) => {
  return (
    <SpotlightCard
      className={`rounded-3xl p-10 transition-all duration-300 h-full flex flex-col relative ${
        isPopular ? "hover:scale-[1.02]" : "hover:scale-[1.02]"
      } ${className}`}
    >
      {/* Title */}
      <div className="flex gap-2 items-center mb-6">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {isPopular && (
          <div
            className="px-4 py-1 rounded-full text-xs font-semibold text-white"
            style={{
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 1) 0%, rgba(139, 92, 246, 1) 100%)",
              boxShadow:
                "0 0 20px rgba(99, 102, 241, 0.8), 0 0 40px rgba(99, 102, 241, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.2)",
              textShadow:
                "0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(139, 92, 246, 0.6)",
            }}
          >
            Popular
          </div>
        )}
      </div>

      {/* Price */}
      <div className="mb-8">
        {customPrice ? (
          <div className="text-5xl font-bold text-white">{customPriceText}</div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-bold text-white">${price}</span>
              <span className="text-gray-400 text-base font-normal">
                / {period}
              </span>
            </div>
          </>
        )}
      </div>

      {/* CTA Button - Positioned before features - Only show if buttonText or onButtonClick is provided */}
      {(buttonText || onButtonClick) && (
        <button
          onClick={onButtonClick}
          className="w-full py-4 rounded-xl font-semibold text-base transition-all duration-300 mb-8"
          style={{
            background: isPopular
              ? "rgba(67, 56, 202, 1)"
              : "rgba(30, 58, 138, 1)",
            boxShadow: isPopular
              ? "0 8px 24px rgba(67, 56, 202, 0.5)"
              : "0 4px 16px rgba(30, 58, 138, 0.3)",
            border: "none",
            color: "white",
          }}
        >
          {buttonText}
        </button>
      )}

      {/* Includes Label */}
      <div className="text-base text-gray-400 font-light mb-4 text-left leading-relaxed">
        Includes:
      </div>

      {/* Features List */}
      <div className="space-y-4 flex-grow">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-400 text-base leading-relaxed">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </SpotlightCard>
  );
};

export default PricingCard;
