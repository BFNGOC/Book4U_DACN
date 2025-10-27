import React from "react";

const ProgressSteps = ({ steps = [], currentStep = 0 }) => {
  return (
    <div className="flex items-center justify-center px-10 py-4 mb-10 border-b-2 border-gray-200">
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="flex items-center">
            {/* Nút tròn */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  isActive ? "bg-orange-500" : "bg-gray-300"
                }`}
              />
              <p
                className={`text-sm mt-2 whitespace-nowrap transition-colors duration-300 ${
                  isActive ? "text-orange-600 font-medium" : "text-gray-400"
                }`}
              >
                {step}
              </p>
            </div>

            {/* Thanh nối giữa các bước */}
            {!isLast && (
              <div
                className={`h-[2px] mx-8 transition-all duration-500 ${
                  index < currentStep ? "bg-orange-500" : "bg-gray-200"
                }`}
                style={{
                  width: "80px", // độ dài line đồng đều
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressSteps;
