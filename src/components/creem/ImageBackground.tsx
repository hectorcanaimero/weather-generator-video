import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { Colors } from "../../theme";

export default function ImageBackground() {
  const frame = useCurrentFrame();

  // Trucking shot: Camera moves horizontally while keeping center in view
  // This creates a parallax effect that feels 3D even on a 2D plane
  const cameraOffset = interpolate(
    frame,
    [0, 150], // Start to end of animation (150 frames at 60fps = 2.5 seconds)
    [-30, 30], // Camera moves from left (-30%) to right (+30%)
    {
      easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Smooth cinematic easing
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Subtle zoom-out effect for more cinematic depth
  const scale = interpolate(
    frame,
    [0, 150],
    [1.15, 1.0], // Start slightly zoomed in, end at normal
    {
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{ backgroundColor: Colors.accent, overflow: "hidden" }}
    >
      <div
        style={{
          width: "130%",
          height: "100%",
          position: "relative",
          transform: `translateX(${cameraOffset}%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {/* <Img
          src={staticFile("social-templates.png")}
          style={{
            width: "100%", // Image wider than viewport for panning room
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            position: "absolute",
            left: "50%",
            transform: `translateX(calc(-65% + ${imageOffset}%))`,
          }}
        /> */}
      </div>
    </AbsoluteFill>
  );
}
