import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Lottie } from "@remotion/lottie";
import { useLottie } from "../../hooks/useLottie";

export default function BigCustomer({
  bestCustomer,
}: {
  bestCustomer: number;
}) {
  const frame = useCurrentFrame();
  const coinAnimationData = useLottie("/lottie/coin.json");

  // Animation timing
  const textDuration = 60; // 1 second at 60fps
  const textDelay = 0; // Start immediately
  const revenueStartFrame = textDelay + textDuration; // Start after text appears
  const revenueFadeDuration = 60; // 1 second for revenue fade-in
  const revenueCounterStartFrame = revenueStartFrame + revenueFadeDuration; // Start counter after revenue is visible
  const animationDuration = 120; // 2 seconds at 60fps for counter

  // "Your best customer spent" animation: bottom-up fade in
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

  // Revenue number animation: same bottom-up fade in as text
  const revenueOpacity = interpolate(
    frame,
    [revenueStartFrame, revenueStartFrame + revenueFadeDuration / 2],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const revenueTranslateY = interpolate(
    frame,
    [revenueStartFrame, revenueStartFrame + revenueFadeDuration],
    [100, 0], // Start 100px below, end at center
    {
      easing: Easing.out(Easing.back(1.2)), // Spring effect
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Interpolate revenue from 0 to target value (starts after revenue is visible)
  const animatedRevenue = interpolate(
    frame,
    [revenueCounterStartFrame, revenueCounterStartFrame + animationDuration],
    [0, bestCustomer],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Format the revenue number
  const formatRevenue = (value: number): string => {
    if (value >= 1000000) {
      const millions = value / 1000000;
      return `$${millions.toFixed(1)}M`;
    } else if (value >= 1000) {
      const thousands = value / 1000;
      return `$${thousands.toFixed(1)}K`;
    } else {
      return `$${Math.floor(value).toLocaleString()}`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full">
      <div
        className="text-[100px] mx-auto w-full"
        style={{
          opacity: textOpacity,
          transform: `translateY(${textTranslateY}px)`,
        }}
      >
        Your best customer spent{" "}
        {coinAnimationData && (
          <Lottie
            animationData={coinAnimationData}
            className="inline-block align-middle"
            style={{ width: 100, height: 100 }}
            loop
          />
        )}
      </div>
      <div
        className="text-[200px] w-full font-bold"
        style={{
          opacity: revenueOpacity,
          transform: `translateY(${revenueTranslateY}px)`,
        }}
      >
        {formatRevenue(animatedRevenue)}
      </div>
    </div>
  );
}
