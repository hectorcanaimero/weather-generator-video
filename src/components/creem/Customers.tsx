import { useCurrentFrame, interpolate, Easing, useVideoConfig } from "remotion";
import { Lottie } from "@remotion/lottie";
import { useLottie } from "../../hooks/useLottie";
import { Colors } from "../../theme";

export default function Customers({
  totalCustomers,
}: {
  totalCustomers: number;
}) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const sunglassesAnimationData = useLottie("/lottie/sunglasses.json");

  // Animation timing
  const animationDuration = 180; // 3 seconds at 60fps
  const animationDelay = 0;
  const staggerDelay = 0.5; // Delay between each customer appearance (in frames)

  // Calculate grid dimensions to fill the frame
  // Leave space for title at top (200px) and padding
  const titleHeight = 150;
  const padding = 50;
  const availableHeight = height - titleHeight - padding * 2;
  const availableWidth = width - padding * 2;
  const gap = 8; // Gap between icons

  // Calculate dynamic icon size based on number of customers
  // Icons get smaller as the number of customers increases
  const minIconSize = 30;
  const maxIconSize = 150;

  // Calculate optimal grid dimensions for the number of customers
  // Try to make it roughly square or slightly wider
  const aspectRatio = availableWidth / availableHeight;
  const targetCols = Math.ceil(Math.sqrt(totalCustomers * aspectRatio));
  const targetRows = Math.ceil(totalCustomers / targetCols);

  // Calculate icon size that would fit these dimensions
  // As customers increase, icon size decreases
  const calculatedWidth =
    (availableWidth - gap * (targetCols - 1)) / targetCols;
  const calculatedHeight =
    (availableHeight - gap * (targetRows - 1)) / targetRows;
  let iconSize = Math.min(calculatedWidth, calculatedHeight);

  // Clamp to min/max bounds
  iconSize = Math.max(minIconSize, Math.min(maxIconSize, iconSize));

  // Calculate actual grid dimensions based on icon size
  const cols = Math.max(1, Math.floor(availableWidth / (iconSize + gap)));
  const rows = Math.max(1, Math.floor(availableHeight / (iconSize + gap)));
  const maxVisibleCustomers = cols * rows;

  // Check if we need to center the grid (when there aren't enough customers)
  const needsCentering = totalCustomers < maxVisibleCustomers;

  // Calculate how many columns we actually need for the customers
  // When centering, use the optimal column count for the actual number of customers
  // This ensures proper alignment without weird wrapping
  let actualCols = cols;
  if (needsCentering) {
    // Find the best column count that fits the customers nicely
    // Try to make it as square as possible
    actualCols = Math.ceil(Math.sqrt(totalCustomers));
    // But ensure it doesn't exceed the available columns
    actualCols = Math.min(actualCols, cols);
    // Also ensure we have at least 1 column
    actualCols = Math.max(1, actualCols);
  }

  // Animate the number of visible customers
  const animatedCustomerCount = interpolate(
    frame,
    [animationDelay, animationDelay + animationDuration],
    [0, Math.min(totalCustomers, maxVisibleCustomers)],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const visibleCount = Math.floor(animatedCustomerCount);
  const customersToShow = Math.min(visibleCount, maxVisibleCustomers);

  return (
    <div
      className="flex flex-col items-center w-full h-full"
      style={{ padding: `${padding}px` }}
    >
      <div
        className="text-[100px] mb-4 gap-4"
        style={{ height: titleHeight, display: "flex", alignItems: "center" }}
      >
        <span>
          You had <strong>{totalCustomers.toLocaleString()}</strong> customers
        </span>
        {sunglassesAnimationData && (
          <Lottie
            animationData={sunglassesAnimationData}
            className="ml-8 inline-block align-middle"
            style={{ width: 100, height: 100 }}
            loop
          />
        )}
      </div>
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${needsCentering ? actualCols : cols}, ${iconSize}px)`,
          gap: `${gap}px`,
          justifyContent: "center",
          alignContent: "center",
          height: `${availableHeight}px`,
          width: needsCentering ? "auto" : "100%",
          margin: needsCentering ? "0 auto" : "0",
        }}
      >
        {Array.from({ length: customersToShow }).map((_, index) => {
          // Calculate when this customer should appear
          const customerStartFrame = animationDelay + index * staggerDelay;
          const customerFrame = frame - customerStartFrame;

          // Fade in and scale up animation for each customer
          const opacity = interpolate(customerFrame, [0, 10], [0, 1], {
            easing: Easing.out(Easing.ease),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const scale = interpolate(customerFrame, [0, 10], [0.5, 1], {
            easing: Easing.out(Easing.back(1.2)),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={index}
              className="flex items-center justify-center"
              style={{
                opacity,
                transform: `scale(${scale})`,
              }}
            >
              <CustomerIcon size={iconSize} />
            </div>
          );
        })}
      </div>
      {totalCustomers > maxVisibleCustomers &&
        visibleCount >= maxVisibleCustomers && (
          <div className="text-[40px] mt-4 font-light">
            and {(totalCustomers - maxVisibleCustomers).toLocaleString()}{" "}
            more...
          </div>
        )}
    </div>
  );
}

function CustomerIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: size, height: size, color: Colors.accent }}
    >
      <path
        fillRule="evenodd"
        d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
