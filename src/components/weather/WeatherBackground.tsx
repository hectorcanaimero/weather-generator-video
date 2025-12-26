import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";

export default function WeatherBackground() {
  const frame = useCurrentFrame();

  // Animated gradient background
  const backgroundHue = interpolate(frame, [0, 300], [200, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Rain drops animation
  const rainDrops = Array.from({ length: 8 }, (_, i) => {
    const xPos = 15 + i * 12;
    const delay = i * 5;
    const yPos = interpolate(
      frame,
      [delay, delay + 60],
      [-10, 110],
      {
        easing: Easing.linear,
        extrapolateLeft: "clamp",
        extrapolateRight: "extend",
      }
    );

    const opacity = interpolate(
      frame,
      [delay, delay + 10, delay + 50, delay + 60],
      [0, 0.6, 0.6, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    return { xPos, yPos: yPos % 120, opacity };
  });

  // Clouds floating animation
  const cloudFloat = interpolate(frame, [0, 120], [0, 10], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "mirror",
  });

  // Lightning flash effect
  const lightningFrame = Math.floor(frame / 120) % 3;
  const lightningFlash = lightningFrame === 0 && frame % 120 < 5 ? 0.3 : 0;

  return (
    <AbsoluteFill>
      {/* Animated gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg,
            hsl(${backgroundHue}, 30%, 65%) 0%,
            hsl(${backgroundHue}, 25%, 55%) 100%)`,
        }}
      />

      {/* Lightning flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "white",
          opacity: lightningFlash,
          pointerEvents: "none",
        }}
      />

      {/* Main isometric scene container */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "55%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "800px",
        }}
      >
        {/* Isometric base platform */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%) rotateX(60deg) rotateZ(45deg)",
            width: "600px",
            height: "600px",
            background: "linear-gradient(135deg, #4A5568 0%, #2D3748 100%)",
            borderRadius: "20px",
            boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
          }}
        />

        {/* Greenhouse structure */}
        <div
          style={{
            position: "absolute",
            left: "55%",
            top: "35%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Greenhouse base */}
          <div
            style={{
              width: "120px",
              height: "80px",
              background: "linear-gradient(135deg, #68D391 0%, #48BB78 100%)",
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              opacity: 0.3,
            }}
          />
          {/* Greenhouse dome */}
          <div
            style={{
              position: "absolute",
              top: "-40px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "100px",
              height: "60px",
              background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)",
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              border: "2px solid rgba(255,255,255,0.5)",
            }}
          />
        </div>

        {/* Buildings */}
        <div
          style={{
            position: "absolute",
            left: "30%",
            top: "40%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Building 1 - Yellow */}
          <div
            style={{
              width: "80px",
              height: "100px",
              background: "linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)",
              borderRadius: "4px",
              boxShadow: "4px 4px 8px rgba(0,0,0,0.2)",
            }}
          >
            {/* Windows */}
            <div style={{ padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: "rgba(255,255,255,0.6)",
                    borderRadius: "2px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Building 2 - Brown/Red */}
        <div
          style={{
            position: "absolute",
            left: "25%",
            top: "48%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            style={{
              width: "90px",
              height: "80px",
              background: "linear-gradient(135deg, #C05621 0%, #9C4221 100%)",
              borderRadius: "4px",
              boxShadow: "4px 4px 8px rgba(0,0,0,0.2)",
            }}
          />
        </div>

        {/* Storm clouds */}
        <div
          style={{
            position: "absolute",
            left: "20%",
            top: "15%",
            transform: `translateY(${cloudFloat}px)`,
          }}
        >
          {/* Cloud cluster */}
          <div style={{ position: "relative", width: "150px", height: "80px" }}>
            <div
              style={{
                position: "absolute",
                width: "60px",
                height: "60px",
                background: "linear-gradient(135deg, #4A5568 0%, #2D3748 100%)",
                borderRadius: "50%",
                left: "0px",
                top: "10px",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "80px",
                height: "70px",
                background: "linear-gradient(135deg, #4A5568 0%, #2D3748 100%)",
                borderRadius: "50%",
                left: "40px",
                top: "0px",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "50px",
                height: "50px",
                background: "linear-gradient(135deg, #4A5568 0%, #2D3748 100%)",
                borderRadius: "50%",
                left: "90px",
                top: "15px",
              }}
            />

            {/* Lightning bolt from cloud */}
            <svg
              width="30"
              height="50"
              viewBox="0 0 30 50"
              style={{
                position: "absolute",
                left: "60px",
                top: "60px",
                opacity: lightningFlash > 0 ? 1 : 0,
                transition: "opacity 0.1s",
              }}
            >
              <path
                d="M15 0 L10 20 L18 20 L12 50 L25 18 L16 18 L20 0 Z"
                fill="#FCD34D"
                stroke="#F59E0B"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>

        {/* Right cloud */}
        <div
          style={{
            position: "absolute",
            left: "70%",
            top: "20%",
            transform: `translateY(${-cloudFloat}px)`,
          }}
        >
          <div style={{ position: "relative", width: "120px", height: "60px" }}>
            <div
              style={{
                position: "absolute",
                width: "50px",
                height: "50px",
                background: "linear-gradient(135deg, #4A5568 0%, #2D3748 100%)",
                borderRadius: "50%",
                left: "0px",
                top: "10px",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "60px",
                height: "55px",
                background: "linear-gradient(135deg, #4A5568 0%, #2D3748 100%)",
                borderRadius: "50%",
                left: "35px",
                top: "0px",
              }}
            />

            {/* Lightning bolt */}
            <svg
              width="25"
              height="45"
              viewBox="0 0 25 45"
              style={{
                position: "absolute",
                left: "45px",
                top: "50px",
                opacity: lightningFlash > 0 ? 0.8 : 0,
                transition: "opacity 0.1s",
              }}
            >
              <path
                d="M12 0 L8 18 L14 18 L10 45 L20 16 L13 16 L16 0 Z"
                fill="#FCD34D"
                stroke="#F59E0B"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>

        {/* Animated rain drops */}
        {rainDrops.map((drop, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${drop.xPos}%`,
              top: `${drop.yPos}%`,
              width: "3px",
              height: "20px",
              background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)",
              opacity: drop.opacity,
              borderRadius: "2px",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}
