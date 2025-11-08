import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import type { TutorialPosition } from "../levels/types";
import "./TutorialOverlay.css";

export function TutorialOverlay() {
  const currentStep = useGameStore((state) => state.tutorial.currentStep);
  const dismissTutorialStep = useGameStore((state) => state.dismissTutorialStep);
  const completeTutorialStep = useGameStore(
    (state) => state.completeTutorialStep,
  );
  const skipTutorialForLevel = useGameStore(
    (state) => state.skipTutorialForLevel,
  );

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentStep || !cardRef.current) {
      return;
    }

    const resolveTarget = () =>
      currentStep.targetElement
        ? (document.querySelector(currentStep.targetElement) as Element | null)
        : null;

    const reposition = () => {
      if (!cardRef.current) {
        return;
      }
      positionCard(resolveTarget(), cardRef.current, currentStep.position);
    };

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [currentStep]);

  if (!currentStep) {
    return null;
  }

  const handleGotIt = () => {
    completeTutorialStep(currentStep.id);
  };

  const handleSkip = () => {
    skipTutorialForLevel();
    dismissTutorialStep();
  };

  return (
    <div className="tutorial-overlay" role="presentation">
      <div className="tutorial-backdrop" onClick={handleGotIt} />

      {currentStep.targetElement ? (
        <TargetHighlight selector={currentStep.targetElement} />
      ) : null}

      <div
        className={`tutorial-card tutorial-card-${currentStep.position}`}
        ref={cardRef}
      >
        <div className="tutorial-content">
          <h3 className="tutorial-title">{currentStep.title}</h3>
          <p className="tutorial-message">{currentStep.message}</p>

          {currentStep.illustration ? (
            <div className="tutorial-illustration">
              {currentStep.illustration.type === "bounding_box" ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: currentStep.illustration.svgContent ?? "",
                  }}
                  style={{
                    width: currentStep.illustration.width ?? 200,
                    height: currentStep.illustration.height ?? 120,
                  }}
                />
              ) : currentStep.illustration.type === "custom_svg" ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: currentStep.illustration.svgContent ?? "",
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="tutorial-actions">
          <button
            type="button"
            className="tutorial-button tutorial-skip"
            onClick={handleSkip}
          >
            Skip Tutorial
          </button>
          <button
            type="button"
            className="tutorial-button tutorial-primary"
            onClick={handleGotIt}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

function TargetHighlight({ selector }: { selector: string }) {
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const highlight = highlightRef.current;
    if (!highlight) {
      return;
    }

    const updatePosition = () => {
      if (!highlightRef.current) {
        return;
      }
      const target = document.querySelector(selector);
      if (!target) {
        highlightRef.current.style.display = "none";
        return;
      }

      const rect = target.getBoundingClientRect();
      highlightRef.current.style.display = "block";
      highlightRef.current.style.top = `${rect.top - 8}px`;
      highlightRef.current.style.left = `${rect.left - 8}px`;
      highlightRef.current.style.width = `${rect.width + 16}px`;
      highlightRef.current.style.height = `${rect.height + 16}px`;
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [selector]);

  return <div className="tutorial-highlight" ref={highlightRef} />;
}

function positionCard(
  target: Element | null,
  card: HTMLElement,
  position: TutorialPosition,
) {
  const targetRect = target?.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();

  const centerPosition = () => ({
    top: window.innerHeight / 2 - cardRect.height / 2,
    left: window.innerWidth / 2 - cardRect.width / 2,
  });

  let coordinates = centerPosition();

  switch (position) {
    case "top":
      if (targetRect) {
        coordinates = {
          top: targetRect.top - cardRect.height - 20,
          left: targetRect.left + (targetRect.width - cardRect.width) / 2,
        };
      }
      break;
    case "bottom":
      if (targetRect) {
        coordinates = {
          top: targetRect.bottom + 20,
          left: targetRect.left + (targetRect.width - cardRect.width) / 2,
        };
      }
      break;
    case "left":
      if (targetRect) {
        coordinates = {
          top: targetRect.top + (targetRect.height - cardRect.height) / 2,
          left: targetRect.left - cardRect.width - 20,
        };
      }
      break;
    case "right":
      if (targetRect) {
        coordinates = {
          top: targetRect.top + (targetRect.height - cardRect.height) / 2,
          left: targetRect.right + 20,
        };
      }
      break;
    case "center":
    default:
      coordinates = centerPosition();
      break;
  }

  let { top, left } = coordinates;
  top = Math.max(20, Math.min(top, window.innerHeight - cardRect.height - 20));
  left = Math.max(20, Math.min(left, window.innerWidth - cardRect.width - 20));

  card.style.top = `${top}px`;
  card.style.left = `${left}px`;
}
