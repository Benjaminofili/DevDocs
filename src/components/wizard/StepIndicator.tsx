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
    <div className="flex items-center justify-center">
      <div className="flex items-center space-x-8">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300 border-2
                    ${isCompleted 
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100' 
                      : isCurrent 
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-blue-600 dark:border-blue-400 shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span 
                  className={`
                    mt-3 text-xs font-medium text-center max-w-20
                    ${isCurrent 
                      ? 'text-slate-900 dark:text-slate-100' 
                      : isCompleted
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>
              
              {!isLast && (
                <div 
                  className={`
                    w-16 h-0.5 mt-[-20px] rounded-full transition-all duration-300
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
  );
}