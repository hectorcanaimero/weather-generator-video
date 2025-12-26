import { Lottie } from "@remotion/lottie";
import { useLottie } from "../../hooks/useLottie";

export default function Sprinkles() {
  const sprinklesAnimationData = useLottie("/lottie/sprinkles.json");
  return (
    <div className="w-full h-full flex items-center justify-center">
      {sprinklesAnimationData && (
        <Lottie
          animationData={sprinklesAnimationData}
          className="w-[150%] h-[150%]"
        />
      )}
    </div>
  );
}
