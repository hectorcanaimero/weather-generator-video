import { useCurrentFrame, interpolate, Easing } from "remotion";

interface AnimatedWordProps {
  word: string;
  delay: number;
}

function AnimatedWord({ word, delay }: AnimatedWordProps) {
  const frame = useCurrentFrame();
  const framesPerWord = 10;
  const animationStart = delay * framesPerWord;
  const animationDuration = 30;

  // Fade in opacity only
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

  return (
    <span
      style={{
        display: "inline-block",
        opacity,
        marginRight: word === "it..." ? "0" : "0.2em",
      }}
    >
      {word}
    </span>
  );
}

export default function ThatsIt() {
  return (
    <div className="flex flex-col items-center justify-center text-center w-full">
      <div className="text-[200px] mx-auto w-full italic">
        <strong>
          <AnimatedWord word="And" delay={0} />
          <AnimatedWord word="that's" delay={1} />
          <AnimatedWord word="it..." delay={2} />
        </strong>
      </div>
    </div>
  );
}
