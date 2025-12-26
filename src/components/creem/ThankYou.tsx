import { Lottie } from "@remotion/lottie";
import { Img, useCurrentFrame, interpolate, Easing } from "remotion";
import { useLottie } from "../../hooks/useLottie";

interface AnimatedWordProps {
  word: string;
  isStrong?: boolean;
  delay: number;
}

function AnimatedWord({ word, isStrong, delay }: AnimatedWordProps) {
  const frame = useCurrentFrame();
  const framesPerWord = 20;
  const animationStart = delay * framesPerWord;
  const animationDuration = 30;

  // Fade in opacity
  const opacity = interpolate(
    frame,
    [animationStart, animationStart + animationDuration],
    [0, 1],
    {
      easing: Easing.ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Spring pop effect (scale)
  const scale = interpolate(
    frame,
    [animationStart, animationStart + animationDuration],
    [0.5, 1],
    {
      easing: Easing.out(Easing.back(1.5)), // Spring effect with overshoot
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Vertical pop (translateY)
  const translateY = interpolate(
    frame,
    [animationStart, animationStart + animationDuration],
    [50, 0],
    {
      easing: Easing.out(Easing.back(1.2)),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const content = isStrong ? <strong>{word}</strong> : word;

  return (
    <span
      style={{
        display: "inline-block",
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        marginRight: word === "year" ? "0" : "0.2em",
      }}
    >
      {content}
    </span>
  );
}

export default function ThankYou() {
  const iceCreemAnimationData = useLottie("/lottie/ice-creem.json");
  const frame = useCurrentFrame();
  const emojiDelay = 8; // Show emoji after 8 words
  const framesPerWord = 20;
  const emojiAnimationStart = emojiDelay * framesPerWord;
  const emojiAnimationDuration = 30;

  // Animate emoji with same spring effect
  const emojiOpacity = interpolate(
    frame,
    [emojiAnimationStart, emojiAnimationStart + emojiAnimationDuration],
    [0, 1],
    {
      easing: Easing.ease,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const emojiScale = interpolate(
    frame,
    [emojiAnimationStart, emojiAnimationStart + emojiAnimationDuration],
    [0.5, 1],
    {
      easing: Easing.out(Easing.back(1.5)),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const emojiTranslateY = interpolate(
    frame,
    [emojiAnimationStart, emojiAnimationStart + emojiAnimationDuration],
    [50, 0],
    {
      easing: Easing.out(Easing.back(1.2)),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div className="relative flex flex-col items-center justify-center text-center w-full">
      <div className="text-[200px] mx-auto w-[70%] leading-none translate-x-[21%] text-center">
        <span className="italic">
          <AnimatedWord word="Thank" isStrong delay={0} />
          <AnimatedWord word="you" isStrong delay={1} />
          <br />
          <AnimatedWord word="for" delay={2} />
          <AnimatedWord word="this" delay={3} />
          <Img
            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f49b/512.webp"
            alt="🔥"
            width={200}
            height={200}
            className="translate-y-[10px]"
            style={{
              display: "inline-block",
              verticalAlign: "middle",
              opacity: emojiOpacity,
              transform: `scale(${emojiScale}) translateY(${emojiTranslateY - 20}px)`,
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://fonts.gstatic.com/s/e/notoemoji/latest/1f49b/512.gif";
            }}
          />
          <AnimatedWord word="awesome" isStrong delay={4} />
          <AnimatedWord word="2025" delay={5} />
          <AnimatedWord word="year" delay={6} />
        </span>
      </div>
      <div className="absolute inset-0">
        {iceCreemAnimationData && (
          <Lottie
            animationData={iceCreemAnimationData}
            className="w-[80%] h-full translate-x-[-24%] translate-y-[-3%]"
          />
        )}
      </div>
    </div>
  );
}
