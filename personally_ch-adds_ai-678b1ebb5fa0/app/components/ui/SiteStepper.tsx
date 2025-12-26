"use client";
import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const steps = [
  { label: "Step 1", desc: "Add Site Details" },
  { label: "Step 2", desc: "Generate Content" },
  { label: "Step 3", desc: "Page Setup" },
  // { label: "Step 4", desc: "Publish your site" },
];

function SiteStepper({
  currentStep,
  percentage,
}: {
  currentStep: number;
  percentage?: number;
}) {
  const totalSteps = steps.length;
  if (!percentage)
    percentage = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="bg-transparent sm:bg-white rounded-xl shadow-none sm:shadow p-0 sm:p-6 flex items-center mb-6">
      <div className="flex items-center w-full">
        <div className="items-center gap-4 w-auto xl:w-1/4 border-r pr-4 hidden lg:flex">
          {/* Progress Circle */}
          <div className="flex justify-center">
            <div style={{ width: 60, height: 60 }}>
              <CircularProgressbar
                className="font-semibold text-sm"
                value={percentage}
                text={`${percentage}%`}
                styles={buildStyles({
                  pathColor: "#0092B8",
                  textColor: "#0F172B",
                  trailColor: "#e5e7eb",
                })}
              />
            </div>
          </div>
          <div className="flex-col hidden xl:flex">
            <h5 className="font-semibold mt-1">Launch Your Site in Minutes</h5>
            <div className="text-sm text-gray-500 mt-1">5 more mins to go!</div>
          </div>
        </div>
        <div className="flex-1 flex justify-center sm:justify-between items-center gap-4 ml-0 lg:ml-4">
          {steps.map((step, idx) => {
            let status = "";
            if (currentStep === idx + 1) status = "active";
            else if (currentStep > idx + 1) status = "completed";
            return (
              <div
                key={step.label}
                className={`${status} step flex flex-col flex-1 max-w-[68px] sm:max-w-full`}
              >
                <span className="text-sm sm:text-base uppercase sm:capitalize">
                  {step.label}
                </span>
                <div className="text-sm">{step.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SiteStepper;
