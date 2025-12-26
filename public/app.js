// Landing Page JavaScript for Weather Video Generator

const form = document.getElementById('videoForm');
const cityInput = document.getElementById('cityInput');
const generateBtn = document.getElementById('generateBtn');
const status = document.getElementById('status');
const progressSteps = document.getElementById('progressSteps');
const videoPreview = document.getElementById('videoPreview');
const previewVideo = document.getElementById('previewVideo');
const downloadBtn = document.getElementById('downloadBtn');
const recentVideos = document.getElementById('recentVideos');
const videoGrid = document.getElementById('videoGrid');

// Progress step elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');

let currentVideoUrl = null;

// Update step status
function updateStep(stepElement, state) {
  stepElement.classList.remove('active', 'completed');
  if (state === 'active') {
    stepElement.classList.add('active');
  } else if (state === 'completed') {
    stepElement.classList.add('completed');
  }
}

// Show status message
function showStatus(message, type) {
  status.textContent = message;
  status.className = 'mt-6 text-sm text-center status';
  status.classList.remove('hidden');

  // Apply Tailwind classes based on type
  if (type === 'error') {
    status.classList.add('text-red-600', 'bg-red-50', 'border', 'border-red-200', 'rounded-lg', 'py-2', 'px-4');
  } else if (type === 'success') {
    status.classList.add('text-green-600', 'bg-green-50', 'border', 'border-green-200', 'rounded-lg', 'py-2', 'px-4');
  } else if (type === 'loading') {
    status.classList.add('text-blue-600', 'bg-blue-50', 'border', 'border-blue-200', 'rounded-lg', 'py-2', 'px-4', 'loading');
  }
}

// Reset all steps
function resetSteps() {
  [step1, step2, step3, step4].forEach(step => {
    step.classList.remove('active', 'completed');
  });
}

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    showStatus('Por favor ingresa una ciudad', 'error');
    return;
  }

  // Disable form
  generateBtn.disabled = true;
  cityInput.disabled = true;
  videoPreview.classList.add('hidden');

  // Reset and show progress
  resetSteps();
  progressSteps.style.display = 'block';
  showStatus('Iniciando generación...', 'loading');

  try {
    // Step 1: Fetch weather data
    updateStep(step1, 'active');
    showStatus('Obteniendo datos del clima...', 'loading');

    const weatherResponse = await fetch('/api/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city }),
    });

    if (!weatherResponse.ok) {
      throw new Error('Error al obtener datos del clima');
    }

    const weatherData = await weatherResponse.json();
    updateStep(step1, 'completed');

    // Step 2: Generate AI image
    updateStep(step2, 'active');
    showStatus('Generando imagen con IA...', 'loading');

    const imageResponse = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city,
        weatherData
      }),
    });

    if (!imageResponse.ok) {
      throw new Error('Error al generar imagen');
    }

    const imageData = await imageResponse.json();
    updateStep(step2, 'completed');

    // Step 3: Render video
    updateStep(step3, 'active');
    showStatus('Renderizando video... Esto puede tomar un momento', 'loading');

    const renderResponse = await fetch('/api/render-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city,
        weatherData,
        imageFilename: imageData.filename,
      }),
    });

    if (!renderResponse.ok) {
      throw new Error('Error al renderizar video');
    }

    const videoData = await renderResponse.json();
    updateStep(step3, 'completed');

    // Step 4: Show preview
    updateStep(step4, 'active');
    showStatus('¡Video generado exitosamente!', 'success');

    // Display video
    currentVideoUrl = videoData.videoUrl;
    previewVideo.src = currentVideoUrl;
    videoPreview.classList.remove('hidden');
    updateStep(step4, 'completed');

    // Refresh gallery with new video
    refreshVideoGallery();

    // Scroll to video
    videoPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (error) {
    console.error('Error:', error);
    showStatus(`Error: ${error.message}`, 'error');
    resetSteps();
  } finally {
    // Re-enable form
    generateBtn.disabled = false;
    cityInput.disabled = false;
  }
});

// Handle download button
downloadBtn.addEventListener('click', () => {
  if (currentVideoUrl) {
    const a = document.createElement('a');
    a.href = currentVideoUrl;
    a.download = `weather-${cityInput.value.toLowerCase().replace(/\s+/g, '-')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
});

// Load recent videos
async function loadRecentVideos() {
  try {
    const response = await fetch('/api/videos?limit=10');
    if (!response.ok) {
      throw new Error('Failed to fetch recent videos');
    }

    const data = await response.json();

    if (data.videos && data.videos.length > 0) {
      displayVideos(data.videos);
      recentVideos.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading recent videos:', error);
  }
}

// Display videos in grid
function displayVideos(videos) {
  videoGrid.innerHTML = '';

  videos.forEach(video => {
    const card = document.createElement('div');
    card.className = 'video-card bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer';

    const weatherIcons = {
      sunny: '☀️',
      rain: '🌧️',
      cloudy: '☁️',
      storm: '⛈️'
    };

    const icon = weatherIcons[video.metadata.condition] || '🌤️';
    const city = video.metadata.city || 'Unknown';
    const temp = video.metadata.temperature || '--';
    const date = video.metadata.date ? new Date(video.metadata.date).toLocaleDateString() : '';

    card.innerHTML = `
      <video src="${video.url}" muted loop onmouseover="this.play()" onmouseout="this.pause(); this.currentTime=0;" class="w-full aspect-[9/16] object-cover bg-gray-100"></video>
      <div class="p-4 border-t border-gray-100">
        <div class="font-semibold text-gray-900 mb-1">${city}</div>
        <div class="flex items-center gap-3 text-sm text-gray-600">
          <span>${icon} ${temp}°C</span>
          ${date ? `<span class="text-gray-400">•</span><span>${date}</span>` : ''}
        </div>
                  <div flex items-center mt-3>
                    <a href="${video.url}" download class="ml-auto text-blue-600 hover:underline" target='_blank'>Descargar</a>
          </div>
      </div>
    `;

    // Click to preview full video
    card.addEventListener('click', () => {
      currentVideoUrl = video.url;
      previewVideo.src = video.url;
      videoPreview.classList.remove('hidden');
      videoPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    videoGrid.appendChild(card);
  });
}

// Load recent videos on page load
loadRecentVideos();

// Reload videos after successful generation
function refreshVideoGallery() {
  loadRecentVideos();
}
