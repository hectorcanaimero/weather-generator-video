import { useCurrentFrame, interpolate, Easing } from "remotion";
import { Colors } from "../../theme";

const words = ["YOUR", "YEAR", "AT", "CREEM", "2025"];

export default function AnimatedText() {
  const frame = useCurrentFrame();
  const framesPerWord = 17; // At 60fps, 40 frames = ~0.67 seconds per word
  const transitionFrames = 3; // Frames for fade in/out transition
  const suspenseFrames = 17; // Suspense delay before last word (0.5 seconds at 60fps)
  const initialAnimationFrames = 20; // Initial fade-in from bottom animation

  // Check if we're in the initial animation period
  const isInitialAnimation = frame < initialAnimationFrames;
  const adjustedFrame = Math.max(0, frame - initialAnimationFrames);

  // Calculate when each word should appear (after initial animation)
  // Last word starts after suspense period
  const lastWordStartFrame =
    initialAnimationFrames +
    (words.length - 1) * framesPerWord +
    suspenseFrames;

  // Determine which word should be visible
  let wordIndex: number;
  let isLastWord: boolean;

  if (isInitialAnimation) {
    // During initial animation, show first word
    wordIndex = 0;
    isLastWord = false;
  } else if (adjustedFrame + initialAnimationFrames < lastWordStartFrame) {
    // Before last word starts, show words normally
    const currentWordIndex = Math.floor(adjustedFrame / framesPerWord);
    wordIndex = Math.min(currentWordIndex, words.length - 2); // Don't show last word yet
    isLastWord = false;
  } else {
    // Show last word
    wordIndex = words.length - 1;
    isLastWord = true;
  }

  const currentWord = words[wordIndex];

  // Calculate position within current word's timeframe
  // For the last word, use absolute frame offset from when it started (after suspense)
  const positionInWord = isLastWord
    ? frame - lastWordStartFrame
    : adjustedFrame % framesPerWord;

  // Check if we're in the suspense period (between CREEM and 2025)
  const suspenseStartFrame =
    initialAnimationFrames + (words.length - 1) * framesPerWord;
  const isInSuspense =
    frame >= suspenseStartFrame && frame < lastWordStartFrame;

  // Initial spring animation: fade in from bottom to center
  const initialOpacity = interpolate(
    frame,
    [0, initialAnimationFrames],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const initialTranslateY = interpolate(
    frame,
    [0, initialAnimationFrames],
    [200, 0], // Start 200px below, end at center
    {
      easing: Easing.out(Easing.back(1.2)), // Spring effect
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Opacity: fade in at start, fade out at end (except last word stays visible)
  // During suspense period, show nothing
  // For the first word, account for initial animation - it should stay visible after initial animation
  const isFirstWord = wordIndex === 0;

  const wordOpacity = isInSuspense
    ? 0
    : isFirstWord
      ? isInitialAnimation
        ? initialOpacity // Use initial opacity during initial animation
        : interpolate(
            adjustedFrame,
            [0, framesPerWord - transitionFrames, framesPerWord],
            [1, 0, 0], // Stay at 1 after initial animation, then fade out
            {
              easing: Easing.ease,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )
      : isLastWord
        ? interpolate(positionInWord, [0, transitionFrames], [0, 1], {
            easing: Easing.ease,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : interpolate(
            positionInWord,
            [
              0,
              transitionFrames,
              framesPerWord - transitionFrames,
              framesPerWord,
            ],
            [0, 1, 1, 0],
            {
              easing: Easing.ease,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

  // Combine initial animation with word transitions
  const opacity = isInitialAnimation ? initialOpacity : wordOpacity;
  const translateY = isInitialAnimation ? initialTranslateY : 0;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          fontSize: "400px",
          fontWeight: "900",
          color: Colors.text,
          opacity,
          transform: `translateY(${translateY}px)`,
          letterSpacing: "0.05em",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {currentWord}
      </div>
    </div>
  );
}
