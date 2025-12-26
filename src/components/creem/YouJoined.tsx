import { useCurrentFrame, interpolate, Easing } from "remotion";

export default function YouJoined({
  joinedDate = "2025-01-01",
}: {
  joinedDate: string;
}) {
  const frame = useCurrentFrame();

  // Animation timing
  const youJoinedDuration = 60; // 1 second at 60fps
  const youJoinedDelay = 0; // Start immediately
  const dateStartFrame = youJoinedDelay + youJoinedDuration; // Start after "You joined" appears
  const dateDuration = 60; // Same duration as "You joined"

  // Format the joinedDate prop into a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
    const getOrdinalSuffix = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${month} ${getOrdinalSuffix(day)} ${year}`;
  };

  const dateText = formatDate(joinedDate);

  // "You joined" animation: bottom-up fade in
  const youJoinedOpacity = interpolate(
    frame,
    [youJoinedDelay, youJoinedDelay + youJoinedDuration / 2],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const youJoinedTranslateY = interpolate(
    frame,
    [youJoinedDelay, youJoinedDelay + youJoinedDuration],
    [100, 0], // Start 100px below, end at center
    {
      easing: Easing.out(Easing.back(1.2)), // Spring effect
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Date animation: same bottom-up fade in as "You joined"
  const dateOpacity = interpolate(
    frame,
    [dateStartFrame, dateStartFrame + dateDuration / 2],
    [0, 1],
    {
      easing: Easing.out(Easing.ease),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const dateTranslateY = interpolate(
    frame,
    [dateStartFrame, dateStartFrame + dateDuration],
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
        className="text-[100px] mx-auto w-full"
        style={{
          opacity: youJoinedOpacity,
          transform: `translateY(${youJoinedTranslateY}px)`,
        }}
      >
        You joined us
      </div>
      <div
        className="text-[180px] w-full font-bold"
        style={{
          opacity: dateOpacity,
          transform: `translateY(${dateTranslateY}px)`,
        }}
      >
        {dateText}
      </div>
    </div>
  );
}
