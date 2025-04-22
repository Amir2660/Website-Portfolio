/** Haalt live weer- en netwerkgegevens op en toont deze op de 'Live Info' pagina.*/

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuratie ---
    const OPENWEATHERMAP_API_KEY = 'd34c49b3462b61356d14d2dde77f1bb7'; // Max 120

    // --- DOM Element Referenties ---
    const weatherCardBody = document.getElementById('weather-card-body');
    const networkCardBody = document.getElementById('network-card-body');

    const loadingStateEl = document.getElementById('loading-state');
    const errorStateEl = document.getElementById('error-state');
    const dataDisplayEl = document.getElementById('data-display');


    /** Toont de laadstatus en verbergt data/foutmelding. */
    function showLoading(message = 'Data ophalen...') {
        if (loadingStateEl) {
            loadingStateEl.innerHTML = `<div class="spinner-border spinner-border-sm me-2" role="status"><span class="visually-hidden">Laden...</span></div> ${message}`;
            loadingStateEl.classList.remove('d-none');
        }
        if (errorStateEl) errorStateEl.classList.add('d-none');
        if (dataDisplayEl) dataDisplayEl.classList.add('d-none');
    }

    /** Toont een foutmelding en verbergt laden/data. */
    function showError(message = 'Er is een onbekende fout opgetreden.') {
        console.error('Error state triggered:', message);
        if (errorStateEl) {
            errorStateEl.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i> ${message}`;
            errorStateEl.classList.remove('d-none');
        }
        if (loadingStateEl) loadingStateEl.classList.add('d-none');
        if (dataDisplayEl) dataDisplayEl.classList.add('d-none'); // Verberg ook data bij fout
    }

    /** Toont de data container en verbergt laden/foutmelding. */
    function showData() {
        if (dataDisplayEl) dataDisplayEl.classList.remove('d-none');
        if (loadingStateEl) loadingStateEl.classList.add('d-none');
        if (errorStateEl) errorStateEl.classList.add('d-none');
        // console.log('UI State: Data Displayed'); // Debug log
    }

    /**
     * Formatteert een Unix timestamp naar een leesbare tijd (HH:MM).
     * @param {number} timestamp - Unix timestamp in seconden.
     * @returns {string} Geformatteerde tijd of 'N/B' bij ongeldige input.
     */
    function formatTime(timestamp) {
        if (typeof timestamp !== 'number' || isNaN(timestamp)) {
            return 'N/B'; // Niet Beschikbaar
        }
        // Gebruik de lokale tijdzone van de gebruiker voor weergave
        return new Date(timestamp * 1000).toLocaleTimeString('nl-BE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Gebruik 24-uurs formaat
        });
    }

    /** Haalt IP-gebaseerde locatie- en netwerkgegevens op van ipapi.co. max 1000*/
    async function fetchIpInfo() {
        if (!networkCardBody) return; // Stop als element niet bestaat

        try {
            networkCardBody.innerHTML = '<p class="text-muted small">Netwerkinfo ophalen...</p>'; // Tussentijdse status
            const response = await fetch('https://ipapi.co/json/');
            if (!response.ok) {
                throw new Error(`IP API HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            // Vul de netwerk kaart met de opgehaalde data
            networkCardBody.innerHTML = `
                <p><i class="bi bi-pc-display-horizontal me-2"></i><strong>IP Adres:</strong> ${data.ip || 'N/B'}</p>
                <p><i class="bi bi-building me-2"></i><strong>Organisatie (ISP):</strong> ${data.org || 'N/B'}</p>
                <p><i class="bi bi-flag-fill me-2"></i><strong>Land:</strong> ${data.country_name || 'N/B'} (${data.country_code || 'N/B'})</p>
                <p><i class="bi bi-geo-alt-fill me-2"></i><strong>Regio:</strong> ${data.region || 'N/B'}</p>
                <p><i class="bi bi-globe-americas me-2"></i><strong>Continent:</strong> ${data.continent_name || 'N/B'} (${data.continent_code || 'N/B'})</p>
                <p><i class="bi bi-currency-euro me-2"></i><strong>Valuta:</strong> ${data.currency_name || 'N/B'} (${data.currency || 'N/B'})</p>
            `;
        } catch (error) {
            console.error("Fout bij ophalen IP info:", error);
            networkCardBody.innerHTML = `<p class="text-danger"><i class="bi bi-x-circle-fill me-2"></i>Kon netwerk informatie niet laden.</p><p class="small text-muted">(${error.message})</p>`;
            // Trigger algemene fout state als data nog niet zichtbaar was
            if (dataDisplayEl && dataDisplayEl.classList.contains('d-none')) {
                showError('Kon netwerk informatie niet laden.');
            }
        }
    }

    /**
     * Haalt huidige weergegevens op van OpenWeatherMap op basis van coördinaten.
     * @param {number} latitude - De breedtegraad.
     * @param {number} longitude - De lengtegraad.
     */
    async function fetchWeatherData(latitude, longitude) {
        // console.log(`Fetching Weather data for Lat: ${latitude}, Lon: ${longitude}`); // Debug log
        if (!weatherCardBody) return; // Stop als element niet bestaat

        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=nl`;
        // console.log('Constructed OpenWeatherMap API URL:', apiUrl); // Debug log

        try {
            weatherCardBody.innerHTML = '<p class="text-muted small">Weerdata ophalen...</p>'; // Tussentijdse status
            const response = await fetch(apiUrl);
            // console.log('OpenWeatherMap API Response Status:', response.status); // Debug log

            if (!response.ok) {
                let errorBodyText = `OpenWeatherMap API HTTP error! Status: ${response.status}`;
                try { // Probeer meer details uit de API response te halen
                    const errorData = await response.json();
                    console.error('OpenWeatherMap API Error Response Body:', errorData);
                    errorBodyText += ` - Message: ${errorData?.message || JSON.stringify(errorData)}`;
                } catch (e) { console.warn('Kon error response body niet lezen als JSON.'); }
                throw new Error(errorBodyText);
            }

            const data = await response.json();
            // console.log('Received OpenWeatherMap Weather Data:', data); // Debug log

            // Controleer of de data aanwezig is
            if (!data || !data.main || !data.sys || !data.weather || !data.weather[0]) {
                console.error('Onverwachte datastructuur van OpenWeatherMap:', data);
                throw new Error('Ontbrekende of onjuiste data van weer API.');
            }

            // Verwerk de data
            const temp = data.main.temp;
            const feelsLike = data.main.feels_like;
            const humidity = data.main.humidity;
            const description = data.weather[0].description;
            const iconCode = data.weather[0].icon; // Icon code voor afbeelding
            const sunriseTimestamp = data.sys.sunrise;
            const sunsetTimestamp = data.sys.sunset;
            const locationName = data.name || `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`; // Gebruik plaatsnaam indien beschikbaar

            // Formatteer de data voor weergave
            const formattedTemp = (typeof temp === 'number') ? `${temp.toFixed(1)} °C` : 'N/B';
            const formattedFeelsLike = (typeof feelsLike === 'number') ? `${feelsLike.toFixed(1)} °C` : 'N/B';
            const formattedHumidity = (typeof humidity === 'number') ? `${humidity} %` : 'N/B';
            // Hoofdletter voor beschrijving
            const formattedDescription = description.charAt(0).toUpperCase() + description.slice(1);
            // Converteer Unix timestamps naar leesbare tijd
            const formattedSunrise = formatTime(sunriseTimestamp);
            const formattedSunset = formatTime(sunsetTimestamp);
            const weatherIconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

            // Vul de weer kaart met de data
            weatherCardBody.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                     <p class="mb-0"><i class="bi bi-geo-alt-fill me-2"></i><strong>Locatie:</strong> ${locationName}</p>
                     <img src="${weatherIconUrl}" alt="${formattedDescription}" title="${formattedDescription}" width="50" height="50">
                </div>
                <p><i class="bi bi-thermometer-half me-2"></i><strong>Temperatuur:</strong> ${formattedTemp}</p>
                <p><i class="bi bi-thermometer-low me-2"></i><strong>Gevoelstemperatuur:</strong> ${formattedFeelsLike}</p>
                <p><i class="bi bi-droplet-half me-2"></i><strong>Luchtvochtigheid:</strong> ${formattedHumidity}</p>
                <p><i class="bi bi-info-circle-fill me-2"></i><strong>Weer:</strong> ${formattedDescription}</p>
                <p><i class="bi bi-sunrise-fill me-2"></i><strong>Zonsopgang:</strong> ${formattedSunrise}</p>
                <p><i class="bi bi-sunset-fill me-2"></i><strong>Zonsondergang:</strong> ${formattedSunset}</p>
            `;

        } catch (error) {
            console.error("Fout bij ophalen of verwerken OpenWeatherMap data:", error);
            weatherCardBody.innerHTML = `<p class="text-danger"><i class="bi bi-x-circle-fill me-2"></i>Kon weerdata niet laden voor deze locatie.</p><p class="small text-muted">(${error.message})</p>`;
            // Trigger fout state als data nog niet zichtbaar was
            if (dataDisplayEl && dataDisplayEl.classList.contains('d-none')) {
                showError('Kon weerdata niet laden.');
            }
        }
    }


    // --- Hoofd Logica ---
    /**
     * Initialiseert het ophalen van data: eerst IP info, dan locatie + weer.
     */
    async function initializeDataFetching() {
        showLoading('Netwerk informatie ophalen...');
        await fetchIpInfo(); // Wacht tot IP info is opgehaald

        // Controleer of Geolocation API beschikbaar is
        if ('geolocation' in navigator) {
            showLoading('Locatie toestemming vragen...');
            navigator.geolocation.getCurrentPosition(
                // Success: Locatie verkregen
                async (position) => {
                    showLoading('Locatie verkregen. Weerdata ophalen...');
                    const { latitude, longitude } = position.coords;
                    await fetchWeatherData(latitude, longitude); // Haal weerdata op
                    showData(); // Toon beide kaarten
                },
                // Error: Locatie niet verkregen
                (error) => {
                    console.error("Geolocation fout:", error);
                    let errorMessage = 'Kon locatie niet bepalen. ';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'Geef toestemming in je browser om locatie te delen voor het weerbericht.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'Locatie informatie is momenteel niet beschikbaar.';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'Timeout bij het opvragen van de locatie.';
                            break;
                        default:
                            errorMessage += `Onbekende fout (Code: ${error.code})`;
                            break;
                    }
                    // Toon foutmelding in de weerkaart, maar toon wel de netwerkdata
                    if (weatherCardBody) {
                        weatherCardBody.innerHTML = `<p class="text-warning"><i class="bi bi-exclamation-circle-fill me-2"></i>${errorMessage}</p>`;
                    }
                    showData(); // Toont de data sectie (met de foutmelding in weerkaart)
                },
                // Geolocation options
                {
                    enableHighAccuracy: false, // Minder nauwkeurig
                    timeout: 10000, // Max 10 seconden wachten
                    maximumAge: 300000 // Max 5 min oude cache gebruiken
                }
            );
        } else {
            // Geolocation niet ondersteund
            console.warn('Geolocation is not supported by this browser.');
            if (weatherCardBody) {
                weatherCardBody.innerHTML = `<p class="text-warning"><i class="bi bi-exclamation-circle-fill me-2"></i>Geolocation wordt niet ondersteund door deze browser.</p>`;
            }
            showData(); // Toon de data sectie zonder weerbericht
        }
    }

    // Start proces
    initializeDataFetching();

}); 