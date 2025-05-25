
let map;
let marker;
let circle;
const userLocationZoom = 15; // Zoomniveau kaart

// Functie om de kaart te initialiseren (kan zowel met default als met user's locatie)
function initializeMap(initialLat, initialLng, initialZoom) {
    // Als de kaart al bestaat verwijdert deze eerst om conflicten te voorkomen
    if (map) {
        map.remove();
    }
    map = L.map('map').setView([initialLat, initialLng], initialZoom);

    L.tileLayer('https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=JYVS50nsInqFTZ9yfrrp', {
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> ' +
            '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>'
    }).addTo(map);

    var logo = L.icon({
        iconUrl: 'images/logoMap.png',
        iconSize: [50, 50], // size van de icon
        iconAnchor: [25, 25], // punt van de icon die overeenkomt met de marker's locatie
        popupAnchor: [-3, -76] // punt van waaruit de popup moet openen ten opzichte van de icon
    });

    // Initialiseer marker en circle
    marker = L.marker([initialLat, initialLng], { icon: logo })
        .addTo(map)
        .bindPopup("<b>Jouw geschatte locatie</b>") // Voeg een popup toe

    circle = L.circle([initialLat, initialLng], {
        color: 'blue', // Kleur rand
        fillColor: '#30f', // Kleur binnenkant
        fillOpacity: 0.5, // Transparantie binnenkant
        radius: 300 // Straal in meters
    }).addTo(map);
}

// Functie om de kaart te updaten met de gebruikerslocatie
window.updateMapWithUserLocation = function (latitude, longitude) {
    if (map) {
        map.setView([latitude, longitude], userLocationZoom);
        if (marker) {
            marker.setLatLng([latitude, longitude]).openPopup(); // Verplaats marker en open popup
        }
        if (circle) {
            circle.setLatLng([latitude, longitude]); // Verplaats cirkel naar nieuwe locatie
        }
    } else {
        // Als de kaart nog niet is geïnitialiseerd, initialiseer deze met de gebruikerslocatie
        console.warn("Kaart was nog niet geïnitialiseerd. Initialiseer nu met gebruikerslocatie.");
        initializeMap(latitude, longitude, userLocationZoom);
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Initialiseer de kaart met een standaard locatie
    initializeMap(51.22879677980391, 4.404366480673168, 13); // Standaard Antwerpen
});
