"use client";

import {
  getCurrentPipelineStep,
  getPipelineReminder,
  getPipelineStepIndex,
  PIPELINE_STEPS,
} from "@/lib/event-pipeline";
import type { Event } from "@/lib/types";
import { cn } from "@/lib/utils";

const reminderStyles = {
  info: "text-blue-700",
  warning: "text-amber-700",
  success: "text-emerald-700",
  muted: "text-slate-500",
};

export function EventPipelineStepper({
  event,
  hasDepositPayment,
}: {
  event: Event;
  hasDepositPayment: boolean;
}) {
  const current = getCurrentPipelineStep(event);
  const currentIndex = getPipelineStepIndex(current);
  const reminder = getPipelineReminder(event, hasDepositPayment);

  return (
    <div className="flex h-full w-full flex-col justify-center rounded-lg border border-slate-200 bg-white px-4 py-3.5 sm:min-w-[18rem] sm:max-w-[20rem]">
      <ol className="flex items-start justify-between gap-1">
        {PIPELINE_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = step.id === current;

          return (
            <li
              key={step.id}
              className="relative flex min-w-[3.25rem] flex-1 flex-col items-center"
            >
              {index < PIPELINE_STEPS.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[calc(50%+0.625rem)] top-2.5 h-px w-[calc(100%-1.25rem)]",
                    isDone ? "bg-[#4F46E5]" : "bg-slate-200",
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  isDone && "bg-[#4F46E5] text-white",
                  isCurrent &&
                    "bg-[#4F46E5] text-white ring-2 ring-[#4F46E5]/25",
                  !isDone &&
                    !isCurrent &&
                    "border border-slate-200 bg-white text-slate-400",
                )}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "mt-1.5 w-full px-0.5 text-center text-[11px] leading-snug",
                  isCurrent
                    ? "font-semibold text-slate-900"
                    : "text-slate-500",
                )}
                title={step.label}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {reminder && (
        <p
          className={cn(
            "mt-2 border-t border-slate-100 pt-2 text-center text-xs font-medium",
            reminderStyles[reminder.tone],
          )}
        >
          {reminder.text}
        </p>
      )}
    </div>
  );
}
