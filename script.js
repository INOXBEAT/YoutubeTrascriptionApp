var player;
var subtitles = [];
var subtitleElements = [];

// Función llamada por la API de YouTube para inicializar el reproductor
function onYouTubeIframeAPIReady() { }

// Función llamada cuando el reproductor de YouTube está listo
function onPlayerReady(event) {
    event.target.playVideo();
    checkTime(); // Iniciar la función de tiempo para resaltar subtítulos
}

// Función para verificar el tiempo del video y resaltar subtítulos
function checkTime() {
    var currentTime = player.getCurrentTime();
    subtitles.forEach(function (subtitle, index) {
        var subtitleElement = subtitleElements[index];
        var nextSubtitleTime = (index + 1 < subtitles.length) ? subtitles[index + 1].time : player.getDuration();

        currentTime >= subtitle.time && currentTime < nextSubtitleTime
            ? subtitleElement.classList.add('highlight')
            : subtitleElement.classList.remove('highlight');
    });
    requestAnimationFrame(checkTime); // Continuar revisando el tiempo
}

// Manejar el envío del formulario
document.getElementById('video-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var videoUrl = document.getElementById('videoUrl').value;
    var fileInput = document.getElementById('fileInput');
    var file = fileInput.files[0];

    if (!file) {
        alert("Por favor, cargue un archivo de transcripción.");
        return;
    }

    if (!videoUrl) {
        alert("Por favor, ingrese una URL de YouTube válida.");
        return;
    }

    // Extraer el ID del video de YouTube de la URL
    function extractVideoId(url) {
        var videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return videoIdMatch ? videoIdMatch[1] : null;
    }

    var videoId = extractVideoId(videoUrl);
    if (!videoId) {
        alert("URL de YouTube inválida.");
        return;
    }

    // Destruir el reproductor existente si ya hay uno
    if (player) {
        player.destroy();
        document.getElementById('full-transcript-container').innerHTML = "";
        subtitleElements = [];
    }

    // Crear un nuevo reproductor de YouTube
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        events: {
            'onReady': onPlayerReady
        }
    });

    // Procesar el archivo de transcripción
    const reader = new FileReader();
    reader.onload = function (e) {
        const lines = e.target.result.split('\n');
        subtitles = [];
        let time = null;

        // Analizar el archivo de transcripción
        lines.forEach(line => {
            line = line.trim();
            const timeMatch = line.match(/^(\d{1,2}):(\d{2})$/);
            if (timeMatch) {
                const minutes = parseInt(timeMatch[1], 10);
                const seconds = parseInt(timeMatch[2], 10);
                time = minutes * 60 + seconds;
            } else if (time !== null) {
                subtitles.push({ time: time, text: line });
                time = null;
            }
        });

        // Mostrar la transcripción completa
        displayFullTranscript();

        // Habilitar la opción de descarga
        enableDownloadOption();
    };

    reader.readAsText(file);
});

// Función para mostrar la transcripción completa
function displayFullTranscript() {
    var fullTranscriptContainer = document.getElementById('full-transcript-container');
    fullTranscriptContainer.innerHTML = ''; // Limpiar contenido anterior
    subtitleElements = [];

    subtitles.forEach(function (subtitle, index) {
        var p = document.createElement('p');
        var a = document.createElement('a');
        a.innerText = subtitle.text;
        a.href = "#";
        a.onclick = function () {
            player.seekTo(subtitle.time, true);
            return false;
        };
        p.appendChild(a);
        fullTranscriptContainer.appendChild(p);
        subtitleElements.push(p);
    });
}

// Función para habilitar la opción de descarga
function enableDownloadOption() {
    var downloadButton = document.getElementById('download-button');
    var transcriptContent = subtitles.map(subtitle => `${Math.floor(subtitle.time / 60)}:${('0' + subtitle.time % 60).slice(-2)} - ${subtitle.text}`).join('\n');

    var blob = new Blob([transcriptContent], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);

    downloadButton.href = url;
    downloadButton.download = 'transcript.txt';
    downloadButton.style.display = 'block';
}
