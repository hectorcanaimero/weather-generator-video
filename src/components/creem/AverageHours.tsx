import { useCurrentFrame, interpolate, Easing } from "remotion";
import { Lottie } from "@remotion/lottie";
import { useLottie } from "../../hooks/useLottie";

export default function AverageHours({
  saleEveryMinutes,
}: {
  saleEveryMinutes: number;
}) {
  const frame = useCurrentFrame();
  const fireAnimationData = useLottie("/lottie/fire.json");

  // Animation timing
  const textDuration = 60; // 1 second at 60fps
  const textDelay = 0; // Start immediately
  const hoursStartFrame = textDelay + textDuration; // Start after "You made a sale every" appears
  const hoursDuration = 60; // Same duration as text

  const timeToDisplay = `${Math.floor(saleEveryMinutes / 60)} hours ${saleEveryMinutes % 60} minutes`;

  // "You made a sale every" animation: bottom-up fade in
  const textOpacity = interpolate(
    frame,
    [textDelay, textDelay + textDuration / 2],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const textTranslateY = interpolate(
    frame,
    [textDelay, textDelay + textDuration],
    [100, 0], // Start 100px below, end at center
    {
      easing: Easing.out(Easing.back(1.2)), // Spring effect
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Hours animation: same bottom-up fade in as text
  const hoursOpacity = interpolate(
    frame,
    [hoursStartFrame, hoursStartFrame + hoursDuration / 2],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const hoursTranslateY = interpolate(
    frame,
    [hoursStartFrame, hoursStartFrame + hoursDuration],
    [100, 0], // Start 100px below, end at center
    {
      easing: Easing.out(Easing.back(1.2)), // Spring effect
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div className="flex flex-col items-center justify-center text-center w-full">
      <div
        className="text-[100px] mx-auto w-full flex items-center justify-center gap-4"
        style={{
          opacity: textOpacity,
          transform: `translateY(${textTranslateY}px)`,
        }}
      >
        <span>You made a sale every</span>
        {fireAnimationData && (
          <Lottie
            animationData={fireAnimationData}
            className="translate-y-[-20px] h-[130px] w-[130px] inline-block object-cover"
            loop
          />
        )}
      </div>
      <div
        className="text-[200px] w-full font-bold"
        style={{
          opacity: hoursOpacity,
          transform: `translateY(${hoursTranslateY}px)`,
        }}
      >
        {timeToDisplay}
      </div>
    </div>
  );
}
