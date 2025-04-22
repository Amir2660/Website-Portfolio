/**functies voor auto jaar **/

document.addEventListener('DOMContentLoaded', function () {

    function setCopyrightYear() {
        const yearSpan = document.getElementById('copyright-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        } else {
        }
    }

    // Voer de functie uit om het jaar in te stellen
    setCopyrightYear();
}); 