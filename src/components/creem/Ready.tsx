import { Img, useCurrentFrame, useVideoConfig } from "remotion";

export default function Ready() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const textDuration = 2; // seconds
  const textDurationFrames = textDuration * fps;

  const text = "Ready to get started?";
  const framesPerChar = 4; // Speed of typing (characters per frame)
  const typingFrames = text.length * framesPerChar;
  const visibleChars = Math.min(Math.floor(frame / framesPerChar), text.length);
  const displayText = text.slice(0, visibleChars);
  const showCursor =
    frame < typingFrames && frame % (framesPerChar * 2) < framesPerChar;

  return (
    <div className="flex flex-col items-center justify-center text-center w-full">
      {frame < textDurationFrames ? (
        <div className="text-[100px] mx-auto w-full">
          {displayText}
          {showCursor && <span className="animate-pulse">|</span>}
        </div>
      ) : (
        <Img
          src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ac/512.webp"
          alt="🎬"
          width={600}
          height={600}
          style={{ display: "inline-block", verticalAlign: "middle" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ac/512.gif";
          }}
        />
      )}
    </div>
  );
}
