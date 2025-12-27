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
const cityAutocomplete = document.getElementById('cityAutocomplete');
const searchIcon = document.getElementById('searchIcon');
const loadingIcon = document.getElementById('loadingIcon');
const videoLoading = document.getElementById('videoLoading');
const funnyMessage = document.getElementById('funnyMessage');

// Progress step elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');

let currentVideoUrl = null;
let autocompleteTimeout = null;
let selectedCityData = null; // Store full city data (name + country)
let funnyMessageInterval = null;

// Status messages translations
const statusMessages = {
  en: {
    enterCity: 'Please enter a city',
    starting: 'Starting generation...',
    fetchingWeather: 'Fetching weather data...',
    generatingImage: 'Generating AI image...',
    renderingVideo: 'Rendering video... This may take a moment',
    success: 'Video generated successfully!',
    errorWeather: 'Error fetching weather data',
    errorImage: 'Error generating image',
    errorRender: 'Error rendering video',
    download: 'Download'
  },
  es: {
    enterCity: 'Por favor ingresa una ciudad',
    starting: 'Iniciando generación...',
    fetchingWeather: 'Obteniendo datos del clima...',
    generatingImage: 'Generando imagen con IA...',
    renderingVideo: 'Renderizando video... Esto puede tomar un momento',
    success: '¡Video generado exitosamente!',
    errorWeather: 'Error al obtener datos del clima',
    errorImage: 'Error al generar imagen',
    errorRender: 'Error al renderizar video',
    download: 'Descargar'
  },
  pt: {
    enterCity: 'Por favor insira uma cidade',
    starting: 'Iniciando geração...',
    fetchingWeather: 'Obtendo dados do clima...',
    generatingImage: 'Gerando imagem com IA...',
    renderingVideo: 'Renderizando vídeo... Isso pode levar um momento',
    success: 'Vídeo gerado com sucesso!',
    errorWeather: 'Erro ao obter dados do clima',
    errorImage: 'Erro ao gerar imagem',
    errorRender: 'Erro ao renderizar vídeo',
    download: 'Baixar'
  }
};

// Funny loading messages in different languages
const funnyMessages = {
  en: [
    '🎨 Teaching AI about clouds and sunshine...',
    '🌈 Mixing pixels with weather magic...',
    '⚡ Convincing electrons to dance in formation...',
    '🎬 Adding dramatic lighting effects...',
    '🌪️ Spinning up some weather drama...',
    '☁️ Herding clouds into perfect positions...',
    '🎭 Rehearsing with the weather crew...',
    '🔮 Consulting the weather gods...',
    '🎪 Setting up the atmospheric circus...',
    '🌟 Sprinkling digital stardust...',
    '🎨 Painting the sky with 1s and 0s...',
    '🚀 Launching render rockets...',
    '🎵 Composing weather symphonies...',
    '🧙‍♂️ Casting video rendering spells...',
    '🎯 Aiming for pixel perfection...'
  ],
  es: [
    '🎨 Enseñando a la IA sobre nubes y sol...',
    '🌈 Mezclando píxeles con magia meteorológica...',
    '⚡ Convenciendo a los electrones de bailar...',
    '🎬 Agregando efectos de iluminación dramática...',
    '🌪️ Creando drama meteorológico...',
    '☁️ Pastoreando nubes a posiciones perfectas...',
    '🎭 Ensayando con el equipo del clima...',
    '🔮 Consultando a los dioses del clima...',
    '🎪 Montando el circo atmosférico...',
    '🌟 Espolvoreando polvo estelar digital...',
    '🎨 Pintando el cielo con unos y ceros...',
    '🚀 Lanzando cohetes de renderizado...',
    '🎵 Componiendo sinfonías meteorológicas...',
    '🧙‍♂️ Lanzando hechizos de renderizado...',
    '🎯 Apuntando a la perfección de píxeles...'
  ],
  pt: [
    '🎨 Ensinando IA sobre nuvens e sol...',
    '🌈 Misturando pixels com magia do clima...',
    '⚡ Convencendo elétrons a dançar...',
    '🎬 Adicionando efeitos de iluminação dramática...',
    '🌪️ Criando drama meteorológico...',
    '☁️ Pastoreando nuvens para posições perfeitas...',
    '🎭 Ensaiando com a equipe do clima...',
    '🔮 Consultando os deuses do clima...',
    '🎪 Montando o circo atmosférico...',
    '🌟 Polvilhando poeira estelar digital...',
    '🎨 Pintando o céu com uns e zeros...',
    '🚀 Lançando foguetes de renderização...',
    '🎵 Compondo sinfonias meteorológicas...',
    '🧙‍♂️ Lançando feitiços de renderização...',
    '🎯 Mirando na perfeição de pixels...'
  ]
};

// Get current language from index.html
function getCurrentLanguage() {
  return window.currentLang || localStorage.getItem('preferredLanguage') || 'en';
}

// Get translated message
function t(key) {
  const lang = getCurrentLanguage();
  return statusMessages[lang][key] || statusMessages['en'][key];
}

// Get translation from index.html translations
function getTranslation(key) {
  const lang = getCurrentLanguage();
  const translations = window.translations || {};
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}

// Update rate limit display
function updateRateLimitDisplay(remaining) {
  const message = getTranslation('remainingGenerations').replace('{count}', remaining);

  // Show message near the generate button
  let rateLimitInfo = document.getElementById('rateLimitInfo');
  if (!rateLimitInfo) {
    rateLimitInfo = document.createElement('div');
    rateLimitInfo.id = 'rateLimitInfo';
    rateLimitInfo.className = 'text-sm text-gray-600 mt-2 text-center';
    generateBtn.parentElement.appendChild(rateLimitInfo);
  }

  rateLimitInfo.textContent = message;

  // Hide after 5 seconds
  setTimeout(() => {
    if (rateLimitInfo) {
      rateLimitInfo.style.opacity = '0';
      setTimeout(() => rateLimitInfo.remove(), 300);
    }
  }, 5000);
}

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

// Show video loading animation with funny messages
function showVideoLoading() {
  videoPreview.classList.remove('hidden');
  videoLoading.style.display = 'flex';
  previewVideo.style.display = 'none';

  const lang = getCurrentLanguage();
  const messages = funnyMessages[lang];
  let messageIndex = 0;

  // Set initial message
  funnyMessage.textContent = messages[messageIndex];

  // Rotate messages every 3 seconds
  funnyMessageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    funnyMessage.style.opacity = '0';

    setTimeout(() => {
      funnyMessage.textContent = messages[messageIndex];
      funnyMessage.style.opacity = '1';
    }, 300);
  }, 3000);
}

// Hide video loading animation
function hideVideoLoading() {
  if (funnyMessageInterval) {
    clearInterval(funnyMessageInterval);
    funnyMessageInterval = null;
  }
  videoLoading.style.display = 'none';
  previewVideo.style.display = 'block';
}

// Add smooth transition for message changes
funnyMessage.style.transition = 'opacity 0.3s ease-in-out';

// City autocomplete functionality
async function searchCities(query) {
  if (query.length < 2) {
    cityAutocomplete.classList.add('hidden');
    searchIcon.classList.remove('hidden');
    loadingIcon.classList.add('hidden');
    return;
  }

  try {
    // Show loading indicator
    searchIcon.classList.add('hidden');
    loadingIcon.classList.remove('hidden');

    // Call our backend which has the API key
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);

    // Hide loading indicator
    searchIcon.classList.remove('hidden');
    loadingIcon.classList.add('hidden');

    if (response.ok) {
      const cities = await response.json();
      displayCityAutocomplete(cities);
    } else {
      cityAutocomplete.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error fetching cities:', error);
    cityAutocomplete.classList.add('hidden');
    searchIcon.classList.remove('hidden');
    loadingIcon.classList.add('hidden');
  }
}

// Display autocomplete results
function displayCityAutocomplete(cities) {
  if (!cities || cities.length === 0) {
    cityAutocomplete.classList.add('hidden');
    return;
  }

  cityAutocomplete.innerHTML = cities.map(city => {
    const cityName = city.name;
    const countryName = city.country;
    const state = city.state ? `, ${city.state}` : '';

    return `
      <div class="autocomplete-item" data-city="${cityName}" data-country="${countryName}" data-state="${city.state || ''}">
        <span class="city-name">${cityName}</span>
        <span class="country-name">${state} ${countryName}</span>
      </div>
    `;
  }).join('');

  // Add click handlers
  cityAutocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      const cityName = item.getAttribute('data-city');
      const country = item.getAttribute('data-country');
      const state = item.getAttribute('data-state');

      // Store the selected city data
      selectedCityData = {
        city: cityName,
        country: country,
        state: state,
        displayName: `${cityName}${state ? ', ' + state : ''}, ${country}`
      };

      // Show full name in input for clarity
      cityInput.value = selectedCityData.displayName;
      cityAutocomplete.classList.add('hidden');
    });
  });

  cityAutocomplete.classList.remove('hidden');
}

// Handle city input
cityInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();

  // Clear previous timeout
  if (autocompleteTimeout) {
    clearTimeout(autocompleteTimeout);
  }

  // Reset selected city when user types
  selectedCityData = null;

  // Debounce the search
  autocompleteTimeout = setTimeout(() => {
    searchCities(query);
  }, 300);
});

// Close autocomplete when clicking outside
document.addEventListener('click', (e) => {
  if (!cityInput.contains(e.target) && !cityAutocomplete.contains(e.target)) {
    cityAutocomplete.classList.add('hidden');
  }
});

// Handle keyboard navigation (optional enhancement)
cityInput.addEventListener('keydown', (e) => {
  const items = cityAutocomplete.querySelectorAll('.autocomplete-item');
  const selectedItem = cityAutocomplete.querySelector('.autocomplete-item.selected');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!selectedItem) {
      items[0]?.classList.add('selected');
    } else {
      const currentIndex = Array.from(items).indexOf(selectedItem);
      selectedItem.classList.remove('selected');
      items[currentIndex + 1]?.classList.add('selected');
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (selectedItem) {
      const currentIndex = Array.from(items).indexOf(selectedItem);
      selectedItem.classList.remove('selected');
      if (currentIndex > 0) {
        items[currentIndex - 1]?.classList.add('selected');
      }
    }
  } else if (e.key === 'Enter' && selectedItem) {
    e.preventDefault();
    selectedItem.click();
  }
});

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Use only the city name (without country) for the video
  // If user selected from autocomplete, use the stored city name
  // Otherwise, use whatever they typed
  const city = selectedCityData ? selectedCityData.city : cityInput.value.trim();

  if (!city) {
    showStatus(t('enterCity'), 'error');
    return;
  }

  // Get current language
  const language = getCurrentLanguage();

  // Disable form
  generateBtn.disabled = true;
  cityInput.disabled = true;

  // Show video loading animation
  showVideoLoading();

  // Reset and show progress
  resetSteps();
  progressSteps.style.display = 'block';
  showStatus(t('starting'), 'loading');

  try {
    // Step 1: Fetch weather data
    updateStep(step1, 'active');
    showStatus(t('fetchingWeather'), 'loading');

    const weatherResponse = await fetch('/api/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city, language }),
    });

    if (!weatherResponse.ok) {
      throw new Error(t('errorWeather'));
    }

    const weatherData = await weatherResponse.json();
    updateStep(step1, 'completed');

    // Step 2: Generate AI image
    updateStep(step2, 'active');
    showStatus(t('generatingImage'), 'loading');

    const imageResponse = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city,
        weatherData,
        language
      }),
    });

    // Check for rate limit error
    if (imageResponse.status === 429) {
      const errorData = await imageResponse.json();
      const remaining = imageResponse.headers.get('X-RateLimit-Remaining');
      const resetAt = imageResponse.headers.get('X-RateLimit-Reset');

      hideVideoLoading();
      showStatus(errorData.message || t('errorImage'), 'error');

      // Disable generate button until reset
      if (resetAt) {
        const resetDate = new Date(parseInt(resetAt) * 1000);
        generateBtn.disabled = true;
        generateBtn.textContent = `⏳ ${getTranslation('rateLimitReached')}`;

        // Re-enable at midnight
        const now = Date.now();
        const timeUntilReset = resetDate.getTime() - now;
        if (timeUntilReset > 0) {
          setTimeout(() => {
            generateBtn.disabled = false;
            generateBtn.setAttribute('data-i18n', 'generateVideo');
            generateBtn.textContent = getTranslation('generateVideo');
          }, timeUntilReset);
        }
      }

      return;
    }

    if (!imageResponse.ok) {
      throw new Error(t('errorImage'));
    }

    // Read rate limit headers and update UI
    const remaining = imageResponse.headers.get('X-RateLimit-Remaining');
    if (remaining !== null) {
      updateRateLimitDisplay(parseInt(remaining));
    }

    const imageData = await imageResponse.json();
    updateStep(step2, 'completed');

    // Step 3: Render video
    updateStep(step3, 'active');
    showStatus(t('renderingVideo'), 'loading');

    const renderResponse = await fetch('/api/render-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city,
        weatherData,
        imageFilename: imageData.filename,
        language
      }),
    });

    if (!renderResponse.ok) {
      throw new Error(t('errorRender'));
    }

    const videoData = await renderResponse.json();
    updateStep(step3, 'completed');

    // Step 4: Show preview
    updateStep(step4, 'active');
    showStatus(t('success'), 'success');

    // Hide loading and display video
    hideVideoLoading();
    currentVideoUrl = videoData.videoUrl;
    previewVideo.src = currentVideoUrl;
    updateStep(step4, 'completed');

    // Refresh gallery with new video
    refreshVideoGallery();

    // Scroll to video
    videoPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (error) {
    console.error('Error:', error);
    showStatus(`Error: ${error.message}`, 'error');
    resetSteps();
    hideVideoLoading();
    videoPreview.classList.add('hidden');
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
                    <a href="${video.url}" download class="ml-auto text-blue-600 hover:underline" target='_blank'>${t('download')}</a>
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
