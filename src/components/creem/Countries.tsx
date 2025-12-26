import {
  useCurrentFrame,
  interpolate,
  Easing,
  useVideoConfig,
  Img,
} from "remotion";
import { Lottie } from "@remotion/lottie";
import { useLottie } from "../../hooks/useLottie";

export default function Countries({ countries }: { countries: string[] }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const totalCountries = countries.length || 0;
  const globeAnimationData = useLottie("/lottie/globe.json");

  // Typing animation for "You made sales in"
  const typingText = "You made sales in";
  const framesPerChar = 4; // Speed of typing (characters per frame)
  const typingFrames = typingText.length * framesPerChar;
  const visibleChars = Math.min(
    Math.floor(frame / framesPerChar),
    typingText.length,
  );
  const displayText = typingText.slice(0, visibleChars);
  const showCursor =
    frame < typingFrames && frame % (framesPerChar * 2) < framesPerChar;

  // After typing completes, show "47 countries" and then globe
  const countriesStartFrame = typingFrames + 40; // Small delay after typing
  const countriesDuration = 30; // Fade in duration
  const globeStartFrame = countriesStartFrame + countriesDuration + 10; // Start globe after countries
  const globeDuration = 30; // Fade in duration

  // Fade in animation for "47 countries" - bottom-up fade in
  const countriesOpacity = interpolate(
    frame,
    [countriesStartFrame, countriesStartFrame + countriesDuration / 2],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const countriesTranslateY = interpolate(
    frame,
    [countriesStartFrame, countriesStartFrame + countriesDuration],
    [100, 0], // Start 100px below, end at center
    {
      easing: Easing.out(Easing.back(1.2)), // Spring effect
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Fade in animation for globe - same bottom-up fade in
  const globeOpacity = interpolate(
    frame,
    [globeStartFrame, globeStartFrame + globeDuration / 2],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const globeTranslateY = interpolate(
    frame,
    [globeStartFrame, globeStartFrame + globeDuration],
    [100, 0], // Start 100px below, end at center
    {
      easing: Easing.out(Easing.back(1.2)), // Spring effect
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Animation timing for flags (start after title animation)
  const titleAnimationEndFrame = globeStartFrame + globeDuration;
  const animationDuration = 180; // 3 seconds at 60fps
  const animationDelay = titleAnimationEndFrame; // Start after title completes
  const staggerDelay = 0.7; // Delay between each flag appearance (in frames)

  // Calculate grid dimensions to fill the frame
  // Leave space for title at top and padding
  const titleHeight = 150;
  const padding = 50;
  const availableHeight = height - titleHeight - padding * 2;
  const availableWidth = width - padding * 2;
  const flagSize = 200; // Size of each flag
  const gap = 8; // Gap between flags

  const cols = Math.max(1, Math.floor(availableWidth / (flagSize + gap)));
  const rows = Math.max(1, Math.floor(availableHeight / (flagSize + gap)));
  const maxVisibleFlags = cols * rows;

  // Animate the number of visible flags
  const animatedFlagCount = interpolate(
    frame,
    [animationDelay, animationDelay + animationDuration],
    [0, Math.min(totalCountries, maxVisibleFlags)],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const visibleCount = Math.floor(animatedFlagCount);
  const flagsToShow = Math.min(visibleCount, maxVisibleFlags);

  return (
    <div
      className="flex flex-col items-center w-full h-full"
      style={{ padding: `${padding}px` }}
    >
      <div
        className="text-[80px] mb-4 flex items-center gap-4 w-full"
        style={{
          height: titleHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            minWidth: `${typingText.length * 50}px`, // Approximate width to prevent shifting
            textAlign: "left",
          }}
        >
          {displayText}
          {showCursor && <span className="animate-pulse">|</span>}
        </span>
        <strong
          style={{
            opacity: countriesOpacity,
            transform: `translateY(${countriesTranslateY}px)`,
            display: frame >= countriesStartFrame ? "inline" : "hidden",
          }}
        >
          {totalCountries.toLocaleString()} countries
        </strong>
        {globeAnimationData && (
          <Lottie
            animationData={globeAnimationData}
            className="ml-6 size-[100px] inline-block align-middle"
            style={{
              display: frame >= globeStartFrame ? "inline-block" : "hidden",
              verticalAlign: "middle",
              opacity: globeOpacity,
              transform: `translateY(${globeTranslateY}px)`,
            }}
            loop
          />
        )}
      </div>
      <div
        className="grid w-full overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${flagSize}px)`,
          gap: `${gap}px`,
          justifyContent: "center",
          alignContent: "start",
          height: `${availableHeight}px`,
        }}
      >
        {Array.from({ length: flagsToShow }).map((_, index) => {
          // Calculate when this flag should appear
          const flagStartFrame = animationDelay + index * staggerDelay;
          const flagFrame = frame - flagStartFrame;

          // Fade in and scale up animation for each flag
          const opacity = interpolate(flagFrame, [0, 10], [0, 1], {
            easing: Easing.out(Easing.ease),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const scale = interpolate(flagFrame, [0, 10], [0.5, 1], {
            easing: Easing.out(Easing.back(1.2)),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <Img
              key={index}
              src={`https://flagsapi.com/${countries[index]}/flat/64.png`}
              className="flex items-center justify-center text-[180px] rounded-full"
              width={flagSize}
              height={flagSize}
              style={{ opacity, transform: `scale(${scale})` }}
            />
          );
        })}
      </div>
      {totalCountries > maxVisibleFlags && visibleCount >= maxVisibleFlags && (
        <div className="text-[60px] mt-4">
          and {totalCountries - maxVisibleFlags} more
        </div>
      )}
    </div>
  );
}
