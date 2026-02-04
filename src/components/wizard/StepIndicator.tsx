// src/components/wizard/StepIndicator.tsx

'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="w-full overflow-x-auto pb-4 -mx-2 px-2">
      <div className="flex items-center justify-center min-w-max mx-auto">
        <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isLast = index === steps.length - 1;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12
                      rounded-full flex items-center justify-center 
                      font-semibold text-xs sm:text-sm
                      transition-all duration-300 border-2
                      ${isCompleted 
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100' 
                        : isCurrent 
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-blue-600 dark:border-blue-400 shadow-md ring-4 ring-blue-100 dark:ring-blue-900/30' 
                          : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Label - Show only on larger screens or for current step */}
                  <span 
                    className={`
                      mt-2 text-[10px] sm:text-xs font-medium text-center whitespace-nowrap
                      transition-all duration-200
                      ${isCurrent 
                        ? 'text-slate-900 dark:text-slate-100 opacity-100' 
                        : isCompleted
                          ? 'text-slate-700 dark:text-slate-300 opacity-0 sm:opacity-100'
                          : 'text-slate-500 dark:text-slate-400 opacity-0 sm:opacity-100'
                      }
                    `}
                  >
                    {step.label}
                  </span>
                </div>
                
                {/* Connector Line */}
                {!isLast && (
                  <div 
                    className={`
                      w-6 sm:w-12 md:w-16 lg:w-20
                      h-0.5 
                      mb-4 sm:mb-5 md:mb-6
                      rounded-full transition-all duration-300
                      ${isCompleted 
                        ? 'bg-slate-900 dark:bg-slate-100' 
                        : 'bg-slate-200 dark:bg-slate-600'
                      }
                    `}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}