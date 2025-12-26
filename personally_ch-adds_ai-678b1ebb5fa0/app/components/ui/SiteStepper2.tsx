"use client";
import React from "react";

const steps = [
  { label: "Step 1", desc: "Update Site Details" },
  { label: "Step 2", desc: "Update Articles" },
  { label: "Step 3", desc: "Update Pages" },
];

function SiteStepper2({ currentStep }: { currentStep: number }) {
  return (
    <div className="bg-transparent sm:bg-white rounded-xl shadow-none sm:shadow p-0 sm:p-6 flex items-center mb-6">
      <div className="flex items-center w-full">
        <div className="flex-1 flex justify-center sm:justify-between items-center gap-4 ml-0">
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

export default SiteStepper2;
