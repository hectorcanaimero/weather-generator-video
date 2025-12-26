import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";

export default function FadeWrapper({
  children,
  duration,
  fadeOutFrames = 7,
}: {
  children: React.ReactNode;
  duration: number;
  fadeOutFrames?: number;
}) {
  const frame = useCurrentFrame();

  const opacity = useMemo(
    () =>
      interpolate(frame, [duration - fadeOutFrames, duration], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    [frame, duration, fadeOutFrames],
  );

  return (
    <AbsoluteFill
      style={{ opacity }}
      className="flex items-center justify-center"
    >
      {children}
    </AbsoluteFill>
  );
}
