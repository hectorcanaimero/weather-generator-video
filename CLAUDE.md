# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Remotion** project for creating programmatic "Year in Review" videos. It generates animated videos showcasing business statistics (revenue, customers, countries, etc.) with a dark, modern design inspired by Creem.io's branding.

## Development Commands

**Start Development Server (with live preview):**
```bash
npm run dev
```

**Build/Bundle:**
```bash
npm run build
```

**Render Video:**
```bash
npx remotion render
```

**Lint (ESLint + TypeScript):**
```bash
npm run lint
```

**Upgrade Remotion:**
```bash
npm run upgrade
```

## Project Architecture

### Video Structure & Sequencing System

The main composition is in `src/Creem.tsx` which uses a **declarative sequence-based architecture**:

1. **SequenceConfig Pattern**: Each scene is defined as an object with:
   - `component`: The React component to render
   - `duration`: How long (in frames at 60fps) the scene plays
   - `gap`: Frames to wait after this scene before starting the next

2. **Automatic Frame Calculation**: The `currentFrame` counter automatically calculates when each sequence should start based on previous sequences' durations + gaps. This eliminates manual frame math.

3. **Universal FadeWrapper**: All sequences are wrapped in `FadeWrapper` which provides consistent fade-out transitions (default: 7 frames).

### Component Structure

**Main Entry Points:**
- `src/Root.tsx`: Remotion root, registers compositions with default props
- `src/Creem.tsx`: Primary composition orchestrating all sequences

**Scene Components** (`src/components/creem/`):
Each component represents one "scene" in the video:
- `YouJoined.tsx`: Shows when the user joined
- `Revenue.tsx`: Animated revenue counter with Lottie animations
- `Customers.tsx`: Total customers metric
- `Countries.tsx`: Geographic distribution
- `BigCustomer.tsx`: Largest customer highlight
- `AverageHours.tsx`: Sale frequency metric
- `YearSummary.tsx`: Final summary screen
- `AnimatedText.tsx`: Opening title animation
- `ImageBackground.tsx`: Background imagery

**Shared Components:**
- `FadeWrapper.tsx`: Provides fade-out animations using Remotion's `interpolate`

### Key Patterns

**Animation Pattern**: Components use `useCurrentFrame()` + `interpolate()` for time-based animations:
```tsx
const frame = useCurrentFrame();
const value = interpolate(frame, [start, end], [fromValue, toValue], {
  easing: Easing.out(Easing.ease),
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
});
```

**Lottie Loading Pattern**: The `useLottie` hook loads Lottie animations from `/public/lottie/`:
- Uses `delayRender()` / `continueRender()` to ensure animations load before render
- Files referenced via `staticFile(fileName)`
- All Lottie JSON files are in `public/lottie/`

**Styling**: Uses Tailwind CSS v4 (enabled via `remotion.config.ts`) + centralized theme in `src/theme.ts`:
- Dark Creem-inspired palette (blacks, grays, peach accent)
- Utility classes for layout
- Theme exported as `Colors` object

### Configuration

- **remotion.config.ts**: Video output format (JPEG), enables Tailwind
- **tsconfig.json**: Strict TypeScript, React JSX transform
- **Video Settings** (in Root.tsx):
  - Resolution: 1920x1080
  - FPS: 60
  - Duration: 43 seconds (60 * 43 frames)

## Adding New Scenes

To add a new scene:

1. Create component in `src/components/creem/YourScene.tsx`
2. Use `useCurrentFrame()` and `interpolate()` for animations
3. Add to the `sequences` array in `src/Creem.tsx`:
   ```tsx
   {
     component: <YourScene />,
     duration: 60 * 3, // 3 seconds
     gap: 30 // 0.5 second gap
   }
   ```
4. Update total `durationInFrames` in `Root.tsx` if needed

## Modifying Data

Default video props are in `src/Root.tsx` under `defaultProps`. These can be overridden:
- `storeName`: Business name
- `joinedDate`: When they joined (formatted date)
- `totalRevenue`: Revenue in dollars (auto-formatted to K/M)
- `totalCustomers`: Customer count
- `countries`: Array of ISO country codes
- `bestCustomer`: Largest customer revenue
- `saleEveryMinutes`: Average minutes between sales

## Assets

- **Lottie Animations**: `public/lottie/*.json`
- **Images**: `public/*.png`
- Access via `staticFile("filename")` in components
