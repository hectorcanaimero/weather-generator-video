# Weather Video Generator - Landing Page

## Overview

This Landing Page allows users to generate personalized weather videos with AI-generated backgrounds. Users simply input a city name, and the system:

1. Fetches real-time weather data from OpenWeatherMap
2. Generates an isometric 3D city scene using Google Gemini AI
3. Renders a 5-second video with Remotion
4. Provides the video for download

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Make sure your `.env` file has all required credentials:

```env
# Google Gemini API Key for AI image generation
GEMINI_API_KEY=your_gemini_api_key_here

# OpenWeatherMap API Key for weather data
OPENWEATHER_API_KEY=your_openweather_api_key_here

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=weather-videos
```

Get your API keys at:
- Gemini: https://aistudio.google.com/app/apikey
- OpenWeatherMap: https://openweathermap.org/api

### 3. Setup MinIO

You need a MinIO server running. You can use Docker:

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"
```

Or use a hosted MinIO service and update the `.env` accordingly.

### 4. Start the Server

```bash
npm run server
```

The server will start on `http://localhost:3001` and automatically:
- Initialize the MinIO bucket
- Create public read access policy
- Start serving the Landing Page

### 5. Access the Landing Page

Open your browser and navigate to:
```
http://localhost:3001
```

## How It Works

### Frontend (Landing Page)

- **Location**: `public/index.html` and `public/app.js`
- **Features**:
  - City input form
  - Real-time progress indicators (4 steps)
  - Video preview with controls
  - Download functionality
  - **Video Gallery**: Shows the last 6 generated videos in descending order
  - Hover preview on gallery cards
  - Click to view full video
  - Responsive design

### Backend API Endpoints

#### 1. POST `/api/weather`
Fetches real-time weather data for a city.

**Request:**
```json
{
  "city": "Curitiba"
}
```

**Response:**
```json
{
  "city": "Curitiba",
  "temperature": 25,
  "condition": "sunny",
  "description": "clear sky",
  "date": "Thursday, December 26, 2025"
}
```

#### 2. POST `/api/generate-image`
Generates an AI image using Google Gemini.

**Request:**
```json
{
  "city": "Curitiba",
  "weatherData": {
    "city": "Curitiba",
    "temperature": 25,
    "condition": "sunny",
    "description": "clear sky",
    "date": "Thursday, December 26, 2025"
  }
}
```

**Response:**
```json
{
  "filename": "curitiba-1234567890.png",
  "imageUrl": "/weather-bg/curitiba-1234567890.png"
}
```

#### 3. POST `/api/render-video`
Renders the final video using Remotion and uploads to MinIO.

**Request:**
```json
{
  "city": "Curitiba",
  "weatherData": {
    "city": "Curitiba",
    "temperature": 25,
    "condition": "sunny",
    "description": "clear sky",
    "date": "Thursday, December 26, 2025"
  },
  "imageFilename": "curitiba-1234567890.png"
}
```

**Response:**
```json
{
  "videoUrl": "http://localhost:9000/weather-videos/weather-curitiba-1234567890.mp4",
  "filename": "weather-curitiba-1234567890.mp4",
  "etag": "abc123..."
}
```

**Note**: After rendering, the video is uploaded to MinIO and the local file is deleted to save disk space.

#### 4. GET `/api/videos?limit=6`
Lists the most recent videos from MinIO (default: 6).

**Response:**
```json
{
  "videos": [
    {
      "filename": "weather-curitiba-1234567890.mp4",
      "url": "http://localhost:9000/weather-videos/weather-curitiba-1234567890.mp4",
      "size": 1234567,
      "uploadDate": "2025-12-26T12:00:00.000Z",
      "metadata": {
        "city": "Curitiba",
        "temperature": "25",
        "condition": "sunny",
        "date": "Thursday, December 26, 2025"
      }
    }
  ],
  "count": 1
}
```

## Project Structure

```
├── public/
│   ├── index.html          # Landing page HTML
│   ├── app.js             # Frontend JavaScript
│   └── weather-bg/        # Generated AI images
│       └── manifest.json  # Image metadata
├── server/
│   ├── index.ts           # Express server
│   ├── config/
│   │   └── minio.ts       # MinIO client configuration
│   └── routes/
│       ├── weather.ts     # Weather data endpoint
│       ├── generate-image.ts  # AI image generation
│       ├── render-video.ts    # Video rendering
│       └── list-videos.ts     # Recent videos list
├── out/                   # Temporary rendered videos (deleted after upload)
└── src/
    ├── Weather.tsx        # Remotion weather composition
    └── components/
        └── weather/
            └── WeatherBackgroundWithAI.tsx
```

## Development Workflow

### Running Both Services

You'll need two terminal windows:

**Terminal 1 - Remotion Studio** (for development):
```bash
npm run dev
```

**Terminal 2 - Backend Server** (for the Landing Page):
```bash
npm run server
```

### Production Considerations

For production deployment, consider:

1. **Scaling**: Video rendering is CPU-intensive. Consider using:
   - Remotion Lambda for serverless rendering
   - Queue system (Bull, BullMQ) for job processing
   - Separate workers for rendering

2. **File Storage**: Videos are stored in MinIO (S3-compatible):
   - ✅ Already implemented with MinIO
   - Configure bucket lifecycle policies for automatic cleanup
   - Add CDN (CloudFront, CloudFlare) in front of MinIO for better delivery
   - For production, use managed MinIO or AWS S3

3. **Rate Limiting**: Add rate limiting to prevent API abuse:
   - Limit requests per IP
   - Add authentication if needed

4. **Caching**: Cache generated images and videos for the same city

## Troubleshooting

### "GEMINI_API_KEY not configured"
- Make sure `.env` file exists in the project root
- Verify the API key is valid
- Restart the server after adding the key

### "Failed to render video"
- Check that all Remotion dependencies are installed
- Verify the `src/index.ts` entry point exists
- Check server logs for detailed error messages

### Images not appearing
- Ensure `public/weather-bg/` directory exists
- Check that the manifest.json is being updated
- Verify image files are being saved

## Scripts Reference

- `npm run server` - Start the backend server for the Landing Page
- `npm run dev` - Start Remotion Studio for development
- `npm run generate:weather` - Pre-generate weather images (batch script)
- `npm run build` - Bundle Remotion project
- `npm run lint` - Run ESLint and TypeScript checks

## Notes

- Video rendering can take 30-60 seconds depending on your machine
- The Landing Page uses real-time rendering, not pre-generated videos
- Each video is unique with current weather data
- Images are cached in the manifest for potential reuse
