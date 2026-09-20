document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CARRUSEL DE FOTOS ---
    const slides = document.querySelectorAll('.carrusel-slide');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const dotsContainer = document.getElementById('carrusel-dots');

    if (slides.length > 0 && dotsContainer) {
        let currentIndex = 0;
        let autoPlayInterval = null;

        dotsContainer.innerHTML = '';
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => irASlide(index));
            dotsContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.dot');

        function actualizarCarrusel() {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === currentIndex);
                if (dots[i]) dots[i].classList.toggle('active', i === currentIndex);
            });
        }

        function siguienteSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            actualizarCarrusel();
        }

        function anteriorSlide() {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            actualizarCarrusel();
        }

        function irASlide(index) {
            currentIndex = index;
            actualizarCarrusel();
            reiniciarAutoPlay();
        }

        function iniciarAutoPlay() {
            autoPlayInterval = setInterval(siguienteSlide, 4000);
        }

        function reiniciarAutoPlay() {
            clearInterval(autoPlayInterval);
            iniciarAutoPlay();
        }

        if (btnNext) btnNext.addEventListener('click', () => { siguienteSlide(); reiniciarAutoPlay(); });
        if (btnPrev) btnPrev.addEventListener('click', () => { anteriorSlide(); reiniciarAutoPlay(); });

        iniciarAutoPlay();
    }


    // --- 2. REPRODUCTOR MP3 LOCAL ---
    const audio = document.getElementById('audio-player');
    const itemsCancion = document.querySelectorAll('.item-cancion');
    const barraProgreso = document.getElementById('barra-progreso');
    const txtTiempoActual = document.getElementById('tiempo-actual');
    const txtTiempoTotal = document.getElementById('tiempo-total');
    const txtDedicatoria = document.getElementById('texto-dedicatoria');
    const controlVolumen = document.getElementById('control-volumen');
    const iconoVolumen = document.getElementById('icono-volumen');

    let cancionActualIndex = 0;

    function cargarYReproducir(index) {
        itemsCancion.forEach((item, i) => {
            const btn = item.querySelector('.btn-play-track');
            if (i === index) {
                item.classList.add('active');
                if (btn) btn.textContent = '⏸';
            } else {
                item.classList.remove('active');
                if (btn) btn.textContent = '▶';
            }
        });

        const itemSeleccionado = itemsCancion[index];
        const src = itemSeleccionado.dataset.src;
        const nota = itemSeleccionado.dataset.nota;

        if (txtDedicatoria) txtDedicatoria.textContent = nota || "";

        if (!audio.src.endsWith(src)) {
            audio.src = src;
        }

        audio.play().catch(error => console.warn("Autoplay bloqueado:", error));
    }

    itemsCancion.forEach((item, index) => {
        item.addEventListener('click', () => {
            if (cancionActualIndex === index && !audio.paused) {
                audio.pause();
                const btn = item.querySelector('.btn-play-track');
                if (btn) btn.textContent = '▶';
            } else {
                cancionActualIndex = index;
                cargarYReproducir(cancionActualIndex);
            }
        });
    });

    function formatearTiempo(segundos) {
        if (isNaN(segundos)) return "0:00";
        const min = Math.floor(segundos / 60);
        const seg = Math.floor(segundos % 60);
        return `${min}:${seg < 10 ? '0' : ''}${seg}`;
    }

    if (audio) {
        audio.addEventListener('timeupdate', () => {
            if (audio.duration && barraProgreso) {
                const porcentaje = (audio.currentTime / audio.duration) * 100;
                barraProgreso.value = porcentaje;
                if (txtTiempoActual) txtTiempoActual.textContent = formatearTiempo(audio.currentTime);
                if (txtTiempoTotal) txtTiempoTotal.textContent = formatearTiempo(audio.duration);
            }
        });

        audio.addEventListener('ended', () => {
            cancionActualIndex = (cancionActualIndex + 1) % itemsCancion.length;
            cargarYReproducir(cancionActualIndex);
        });
    }

    if (barraProgreso) {
        barraProgreso.addEventListener('input', () => {
            if (audio.duration) {
                audio.currentTime = (barraProgreso.value / 100) * audio.duration;
            }
        });
    }

    if (controlVolumen) {
        controlVolumen.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (audio) audio.volume = val / 100;
            
            if (iconoVolumen) {
                if (val === 0) iconoVolumen.textContent = "🔇";
                else if (val < 50) iconoVolumen.textContent = "m🔉";
                else iconoVolumen.textContent = "🔊";
            }
        });
    }
});