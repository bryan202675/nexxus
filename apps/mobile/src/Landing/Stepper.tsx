import { Children, ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './Stepper.css';

type StepperProps = {
  backButtonText?: string;
  canProceed?: (step: number) => boolean;
  children?: ReactNode;
  completeButtonText?: string;
  contentClassName?: string;
  disableStepIndicators?: boolean;
  footerClassName?: string;
  initialStep?: number;
  nextButtonProps?: Record<string, unknown>;
  nextButtonText?: string;
  onBlockedStep?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  onStepChange?: (step: number) => void;
  renderStepIndicator?: (args: { currentStep: number; onStepClick: (step: number) => void; step: number }) => ReactNode;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
};

// ---------------------------------------------------------------------------
// Componente principal (Stepper)
// ---------------------------------------------------------------------------

export default function Stepper({
  backButtonText = 'Back',
  canProceed = () => true,
  children,
  completeButtonText = 'Complete',
  contentClassName = '',
  disableStepIndicators = false,
  footerClassName = '',
  initialStep = 1,
  nextButtonProps = {},
  nextButtonText = 'Continue',
  onBlockedStep = () => {},
  onFinalStepCompleted = () => {},
  onStepChange = () => {},
  renderStepIndicator,
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) onFinalStepCompleted();
    else onStepChange(newStep);
  };

  // Usada tanto por renderStepIndicator como por StepIndicator: fija la
  // dirección de la animación según hacia dónde se navega y actualiza el paso.
  const goToStep = (clicked: number) => {
    setDirection(clicked > currentStep ? 1 : -1);
    updateStep(clicked);
  };

  return (
    <div className="nx-stepper-shell">
      <div className={`nx-stepper-card ${stepCircleContainerClassName}`}>
        <div className={`nx-stepper-row ${stepContainerClassName}`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            return (
              <FragmentStep key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    currentStep,
                    onStepClick: goToStep,
                    step: stepNumber,
                  })
                ) : (
                  <StepIndicator
                    currentStep={currentStep}
                    disableStepIndicators={disableStepIndicators}
                    onClickStep={goToStep}
                    step={stepNumber}
                  />
                )}
                {index < totalSteps - 1 && <StepConnector isComplete={currentStep > stepNumber} />}
              </FragmentStep>
            );
          })}
        </div>

        <StepContentWrapper
          className={`nx-stepper-content ${contentClassName}`}
          currentStep={currentStep}
          direction={direction}
          isCompleted={isCompleted}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`nx-stepper-footer ${footerClassName}`}>
            <div className={`nx-stepper-nav ${currentStep !== 1 ? 'spread' : 'end'}`}>
              {currentStep !== 1 && (
                <button
                  className="nx-stepper-back"
                  onClick={() => {
                    setDirection(-1);
                    updateStep(currentStep - 1);
                  }}
                  type="button"
                >
                  {backButtonText}
                </button>
              )}
              <button
                className="nx-stepper-next"
                onClick={() => {
                  if (!canProceed(currentStep)) {
                    onBlockedStep(currentStep);
                    return;
                  }
                  setDirection(1);
                  updateStep(isLastStep ? totalSteps + 1 : currentStep + 1);
                }}
                type="button"
                {...nextButtonProps}
              >
                {isLastStep ? completeButtonText : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FragmentStep({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Contenido animado del paso
// ---------------------------------------------------------------------------

type StepContentWrapperProps = {
  children: ReactNode;
  className: string;
  currentStep: number;
  direction: number;
  isCompleted: boolean;
};

function StepContentWrapper({ children, className, currentStep, direction, isCompleted }: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState(0);
  return (
    <motion.div
      animate={{ height: isCompleted ? 0 : parentHeight }}
      className={className}
      style={{ overflow: 'hidden', position: 'relative' }}
      transition={{ duration: 0.38, type: 'spring' }}
    >
      <AnimatePresence custom={direction} initial={false} mode="sync">
        {!isCompleted && (
          <SlideTransition direction={direction} key={currentStep} onHeightReady={(height) => setParentHeight(height)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type SlideTransitionProps = {
  children: ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
};

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (containerRef.current) onHeightReady(containerRef.current.offsetHeight);
  }, [children, onHeightReady]);

  return (
    <motion.div
      animate="center"
      custom={direction}
      exit="exit"
      initial="enter"
      ref={containerRef}
      style={{ left: 0, position: 'absolute', right: 0, top: 0 }}
      transition={{ duration: 0.36 }}
      variants={stepVariants}
    >
      {children}
    </motion.div>
  );
}

const stepVariants = {
  center: { opacity: 1, x: '0%' },
  enter: (direction: number) => ({ opacity: 0, x: direction >= 0 ? '-100%' : '100%' }),
  exit: (direction: number) => ({ opacity: 0, x: direction >= 0 ? '50%' : '-50%' }),
};

// ---------------------------------------------------------------------------
// Componente público Step
// ---------------------------------------------------------------------------

export function Step({ children }: { children: ReactNode }) {
  return <div className="nx-step-default">{children}</div>;
}

// ---------------------------------------------------------------------------
// Indicadores de paso
// ---------------------------------------------------------------------------

type StepIndicatorProps = {
  currentStep: number;
  disableStepIndicators: boolean;
  onClickStep: (step: number) => void;
  step: number;
};

function StepIndicator({ currentStep, disableStepIndicators, onClickStep, step }: StepIndicatorProps) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';
  return (
    <motion.button
      animate={status}
      className="nx-step-indicator"
      initial={false}
      onClick={() => step !== currentStep && !disableStepIndicators && onClickStep(step)}
      style={disableStepIndicators ? { opacity: 0.5, pointerEvents: 'none' } : {}}
      type="button"
    >
      <motion.span
        className="nx-step-indicator-inner"
        transition={{ duration: 0.28 }}
        variants={{ active: { backgroundColor: '#8276ff' }, complete: { backgroundColor: '#8276ff' }, inactive: { backgroundColor: '#1d1b25' } }}
      >
        {status === 'complete' ? <CheckIcon /> : status === 'active' ? <span className="nx-step-active-dot" /> : <span>{step}</span>}
      </motion.span>
    </motion.button>
  );
}

type StepConnectorProps = {
  isComplete: boolean;
};

function StepConnector({ isComplete }: StepConnectorProps) {
  return (
    <span className="nx-step-connector">
      <motion.span
        animate={isComplete ? 'complete' : 'incomplete'}
        className="nx-step-connector-inner"
        initial={false}
        transition={{ duration: 0.34 }}
        variants={{ complete: { backgroundColor: '#8276ff', width: '100%' }, incomplete: { backgroundColor: 'transparent', width: 0 } }}
      />
    </span>
  );
}

function CheckIcon() {
  return (
    <svg className="nx-step-check" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        animate={{ pathLength: 1 }}
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        transition={{ delay: 0.08, duration: 0.28, ease: 'easeOut', type: 'tween' }}
      />
    </svg>
  );
}