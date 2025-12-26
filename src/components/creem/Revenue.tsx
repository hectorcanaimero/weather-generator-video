import { Lottie } from "@remotion/lottie";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { useLottie } from "../../hooks/useLottie";

export default function Revenue({ totalRevenue }: { totalRevenue: number }) {
  const frame = useCurrentFrame();

  // Animation timing
  const animationDuration = 120; // 2 seconds at 60fps
  const animationDelay = 0;

  // Interpolate revenue from 0 to target value
  const animatedRevenue = interpolate(
    frame,
    [animationDelay, animationDelay + animationDuration],
    [0, totalRevenue],
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

  const moneyAnimationData = useLottie("/lottie/money.json");
  const moneyFaceAnimationData = useLottie("/lottie/money-face.json");

  return (
    <div className="relative flex flex-col items-center justify-center text-center w-full">
      <div className="text-[100px] mx-auto w-full flex items-center justify-center gap-8">
        <span>Your total revenue</span>
        {moneyFaceAnimationData && (
          <Lottie
            animationData={moneyFaceAnimationData}
            className="inline-block align-middle"
            style={{ width: 100, height: 100 }}
            loop
          />
        )}
      </div>
      <div className="text-[200px] w-full font-bold">
        {formatRevenue(animatedRevenue)}
      </div>
      <div className="absolute inset-0">
        {moneyAnimationData && (
          <Lottie
            animationData={moneyAnimationData}
            className="w-[120%] mx-auto"
          />
        )}
      </div>
    </div>
  );
}
