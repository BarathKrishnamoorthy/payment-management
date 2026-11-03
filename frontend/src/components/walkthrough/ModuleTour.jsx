import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, X, CheckCircle2, Sparkles, Navigation } from 'lucide-react';

export const ModuleTour = ({ steps = [], isOpen, onClose, onFinish, moduleName = '' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const overlayRef = useRef(null);

  const step = steps[currentStep] || {};

  // Find target element position
  useEffect(() => {
    if (!isOpen || !step.targetId) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const el = document.getElementById(step.targetId) || document.querySelector(`[data-tour="${step.targetId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        });
      } else {
        setTargetRect(null);
      }
    };

    const timer = setTimeout(updatePosition, 150);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, currentStep, step.targetId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, steps.length]);

  if (!isOpen || steps.length === 0) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  // Compute tooltip position relative to target or viewport center
  const getTooltipStyle = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const placement = step.placement || 'bottom';
    const margin = 18;

    if (placement === 'bottom') {
      const top = Math.min(window.innerHeight - 320, targetRect.bottom + margin);
      const left = Math.max(16, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 180));
      return { top: `${top}px`, left: `${left}px` };
    } else if (placement === 'top') {
      const top = Math.max(16, targetRect.top - 280);
      const left = Math.max(16, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 180));
      return { top: `${top}px`, left: `${left}px` };
    } else if (placement === 'left') {
      const top = Math.max(16, targetRect.top);
      const left = Math.max(16, targetRect.left - 380);
      return { top: `${top}px`, left: `${left}px` };
    } else {
      // right
      const top = Math.max(16, targetRect.top);
      const left = Math.min(window.innerWidth - 380, targetRect.right + margin);
      return { top: `${top}px`, left: `${left}px` };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" ref={overlayRef}>
      {/* Darkened backdrop with animated purple tint */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
        onClick={handleSkip}
      />

      {/* Spotlight cutout around the target element */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-xl border-2 border-brand-400 shadow-purple-glow transition-all duration-300"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.72), 0 0 25px 6px rgba(168, 85, 247, 0.75)',
            zIndex: 51,
          }}
        >
          {/* Animated pulsing corner markers */}
          <span className="absolute -top-1 -left-1 w-3 h-3 bg-brand-400 rounded-full animate-ping" />
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-brand-400 rounded-full animate-ping" />
        </div>
      )}

      {/* Floating Tutorial Card */}
      <div
        className="fixed z-[60] w-[90vw] max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-brand-200 overflow-hidden transition-all duration-300"
        style={getTooltipStyle()}
      >
        {/* Header with step pill and skip */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-200" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-brand-200">
                Interactive Walkthrough
              </span>
              <p className="text-xs text-white/90 font-medium">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Skip tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-5">
          {/* Directional visual arrow pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-3">
            <Navigation className="w-3.5 h-3.5 text-brand-600 animate-bounce-subtle" />
            <span>{step.targetName || 'Highlighted Feature'}</span>
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-2">
            {step.title}
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-6 bg-brand-600'
                      : i < currentStep
                      ? 'w-2 bg-brand-300'
                      : 'w-2 bg-slate-200'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Action buttons: Previous, Skip, Next / Finish */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
              )}

              <button
                onClick={handleSkip}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Skip
              </button>

              <button
                onClick={handleNext}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                {isLast ? (
                  <>
                    <span>Finish</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

