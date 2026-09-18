document.addEventListener('DOMContentLoaded', () => {
    // --- 1. NAVEGACIÓN ENTRE PESTAÑAS DE JUEGO ---
    const tabs = {
        puzzle: document.getElementById('btn-tab-rompecabezas'),
        memoria: document.getElementById('btn-tab-memoria'),
        reflejos: document.getElementById('btn-tab-reflejos')
    };

    const paneles = {
        puzzle: document.getElementById('juego-rompecabezas'),
        memoria: document.getElementById('juego-memoria'),
        reflejos: document.getElementById('juego-reflejos')
    };

    function activarTab(nombre) {
        Object.values(tabs).forEach(t => t.classList.remove('active'));
        Object.values(paneles).forEach(p => p.classList.remove('activo'));

        tabs[nombre].classList.add('active');
        paneles[nombre].classList.add('activo');

        if (nombre === 'puzzle') iniciarPuzzle();
        else {
            detenerFisicaPuzzle();
            document.getElementById('contenedor-piezas-libres').innerHTML = '';
        }

        if (nombre === 'memoria') iniciarMemoria();
        if (nombre === 'reflejos') resetearReflejos();
    }

    tabs.puzzle.addEventListener('click', () => activarTab('puzzle'));
    tabs.memoria.addEventListener('click', () => activarTab('memoria'));
    tabs.reflejos.addEventListener('click', () => activarTab('reflejos'));


    // --- 2. JUEGO 1: ROMPECABEZAS CON GRAVEDAD DELICADA ---
    const tablero = document.getElementById('tablero');
    const contenedorPiezasLibres = document.getElementById('contenedor-piezas-libres');
    const btnReiniciarPuzzle = document.getElementById('btn-reiniciar-puzzle');

    const FILAS = 3, COLUMNAS = 3, TAMANO_PIEZA = 100;

    let piezasFlotantes = [];
    let animacionFisicaFrame = null;
    let piezaSiendoArrastrada = null; // Variable global para rastrear la pieza en movimiento

    function iniciarPuzzle() {
        detenerFisicaPuzzle();
        tablero.innerHTML = '';
        contenedorPiezasLibres.innerHTML = '';
        piezasFlotantes = [];

        // Registrar evento global de soltado en cualquier lugar de la pantalla
        document.body.ondragover = (e) => e.preventDefault();
        document.body.ondrop = (e) => {
            e.preventDefault();
            
            // Si hay una pieza siendo arrastrada y NO se soltó sobre una casilla del tablero
            if (piezaSiendoArrastrada && !e.target.closest('.espacio-puzzle')) {
                const posX = Math.max(10, Math.min(window.innerWidth - 110, e.clientX - 50));
                const posY = Math.max(80, Math.min(window.innerHeight - 150, e.clientY - 50));
                
                liberarPiezaConGravedad(piezaSiendoArrastrada, posX, posY);
                piezaSiendoArrastrada = null;
            }
        };

        // Crear casillas del tablero
        for (let i = 0; i < FILAS * COLUMNAS; i++) {
            const espacio = document.createElement('div');
            espacio.classList.add('espacio-puzzle');
            espacio.dataset.indice = i;
            espacio.addEventListener('dragover', (e) => e.preventDefault());
            espacio.addEventListener('drop', soltarPiezaEnTablero);
            tablero.appendChild(espacio);
        }

        // Crear piezas
        for (let i = 0; i < FILAS * COLUMNAS; i++) {
            const pieza = document.createElement('div');
            pieza.classList.add('pieza-puzzle');
            pieza.draggable = true;
            pieza.id = `pieza-${i}`;
            pieza.dataset.indiceCorrecto = i;

            const fila = Math.floor(i / COLUMNAS);
            const columna = i % COLUMNAS;
            pieza.style.backgroundPosition = `${-columna * TAMANO_PIEZA}px ${-fila * TAMANO_PIEZA}px`;

            pieza.addEventListener('dragstart', (e) => {
                piezaSiendoArrastrada = pieza;
                // Remover temporalmente de la física activa mientras se sostiene con el cursor
                piezasFlotantes = piezasFlotantes.filter(p => p.element !== pieza);
            });

            const xInicial = Math.random() * (window.innerWidth - 120);
            const yInicial = Math.random() * (window.innerHeight * 0.4) + 80;

            liberarPiezaConGravedad(pieza, xInicial, yInicial);
        }

        loopFisica();
    }

    function liberarPiezaConGravedad(pieza, x, y) {
        contenedorPiezasLibres.appendChild(pieza);
        
        pieza.style.animation = 'none';
        pieza.style.position = 'fixed';
        pieza.style.left = `${x}px`;
        pieza.style.top = `${y}px`;

        const objetoFisico = {
            element: pieza,
            x: x,
            y: y,
            velocidadY: 0.25 + Math.random() * 0.25, // Caída delicada
            balanceo: Math.random() * Math.PI * 2,
            velocidadBalanceo: 0.01 + Math.random() * 0.015
        };

        piezasFlotantes = piezasFlotantes.filter(p => p.element !== pieza);
        piezasFlotantes.push(objetoFisico);
    }

    function loopFisica() {
        piezasFlotantes.forEach(item => {
            item.y += item.velocidadY;
            item.balanceo += item.velocidadBalanceo;
            
            const oscilacionX = Math.sin(item.balanceo) * 0.4;
            item.x += oscilacionX;

            if (item.x < 10) item.x = 10;
            if (item.x > window.innerWidth - 110) item.x = window.innerWidth - 110;

            // Reaparición infinita por arriba al llegar al borde inferior
            if (item.y > window.innerHeight - 120) {
                item.y = -90;
                item.x = Math.random() * (window.innerWidth - 120);
            }

            item.element.style.top = `${item.y}px`;
            item.element.style.left = `${item.x}px`;
        });

        animacionFisicaFrame = requestAnimationFrame(loopFisica);
    }

    function detenerFisicaPuzzle() {
        if (animacionFisicaFrame) {
            cancelAnimationFrame(animacionFisicaFrame);
            animacionFisicaFrame = null;
        }
        piezasFlotantes = [];
    }

    function soltarPiezaEnTablero(e) {
        e.preventDefault();
        e.stopPropagation();

        const piezaArrastrada = piezaSiendoArrastrada;
        if (!piezaArrastrada) return;

        let espacioDestino = e.target;
        if (!espacioDestino.classList.contains('espacio-puzzle')) {
            espacioDestino = espacioDestino.closest('.espacio-puzzle');
        }

        if (espacioDestino) {
            // Si la casilla de destino ya tenía una pieza, la desenganchamos y la hacemos caer
            if (espacioDestino.children.length > 0) {
                const piezaExistente = espacioDestino.firstChild;
                if (piezaExistente !== piezaArrastrada) {
                    const rect = espacioDestino.getBoundingClientRect();
                    liberarPiezaConGravedad(piezaExistente, rect.left, rect.top);
                }
            }

            // Desactivar movimiento físico para la pieza colocada
            piezasFlotantes = piezasFlotantes.filter(p => p.element !== piezaArrastrada);
            
            // Fijar pieza dentro de la casilla
            espacioDestino.appendChild(piezaArrastrada);
            piezaSiendoArrastrada = null;
            
            verificarVictoriaPuzzle();
        }
    }

    function verificarVictoriaPuzzle() {
        const espacios = document.querySelectorAll('.espacio-puzzle');
        let completado = true;
        espacios.forEach(espacio => {
            const pieza = espacio.firstChild;
            if (!pieza || pieza.dataset.indiceCorrecto != espacio.dataset.indice) completado = false;
        });
        if (completado) {
            detenerFisicaPuzzle();
            setTimeout(() => alert('¡Felicitaciones! Armaste el ramo de flores amarillas. 💐💛'), 100);
        }
    }

    if (btnReiniciarPuzzle) btnReiniciarPuzzle.addEventListener('click', iniciarPuzzle);


    // --- 3. JUEGO 2: MEMORIA ---
    const gridMemoria = document.getElementById('grid-memoria');
    const txtMovimientos = document.getElementById('movimientos-memoria');
    const txtPares = document.getElementById('pares-memoria');
    const btnReiniciarMemoria = document.getElementById('btn-reiniciar-memoria');

    const EMOJIS = ['🌻', '🌹', '🌷', '🌸', '🌼', '🌺'];
    let cartasMemoria = [];
    let primeraCarta = null, segundaCarta = null;
    let bloqueado = false;
    let movimientos = 0, paresEncontrados = 0;

    function iniciarMemoria() {
        gridMemoria.innerHTML = '';
        cartasMemoria = [...EMOJIS, ...EMOJIS];
        cartasMemoria.sort(() => Math.random() - 0.5);

        movimientos = 0;
        paresEncontrados = 0;
        txtMovimientos.textContent = movimientos;
        txtPares.textContent = `0 / ${EMOJIS.length}`;
        primeraCarta = null;
        segundaCarta = null;
        bloqueado = false;

        cartasMemoria.forEach((emoji, index) => {
            const carta = document.createElement('div');
            carta.classList.add('carta-memoria');
            carta.dataset.emoji = emoji;
            carta.dataset.index = index;
            carta.textContent = '❓';

            carta.addEventListener('click', voltearCarta);
            gridMemoria.appendChild(carta);
        });
    }

    function voltearCarta(e) {
        const carta = e.currentTarget;
        if (bloqueado || carta === primeraCarta || carta.classList.contains('emparejada')) return;

        carta.textContent = carta.dataset.emoji;
        carta.classList.add('revelada');

        if (!primeraCarta) {
            primeraCarta = carta;
        } else {
            segundaCarta = carta;
            movimientos++;
            txtMovimientos.textContent = movimientos;
            verificarPareja();
        }
    }

    function verificarPareja() {
        if (primeraCarta.dataset.emoji === segundaCarta.dataset.emoji) {
            primeraCarta.classList.add('emparejada');
            segundaCarta.classList.add('emparejada');
            paresEncontrados++;
            txtPares.textContent = `${paresEncontrados} / ${EMOJIS.length}`;
            resetearSeleccion();

            if (paresEncontrados === EMOJIS.length) {
                setTimeout(() => alert(`¡Increíble! Ganaste el juego de memoria en ${movimientos} movimientos. 🧠✨`), 200);
            }
        } else {
            bloqueado = true;
            setTimeout(() => {
                primeraCarta.textContent = '❓';
                segundaCarta.textContent = '❓';
                primeraCarta.classList.remove('revelada');
                segundaCarta.classList.remove('revelada');
                resetearSeleccion();
            }, 800);
        }
    }

    function resetearSeleccion() {
        [primeraCarta, segundaCarta] = [null, null];
        bloqueado = false;
    }

    if (btnReiniciarMemoria) btnReiniciarMemoria.addEventListener('click', iniciarMemoria);


    // --- 4. JUEGO 3: ATRAPA FLORES (REFLEJOS) ---
    const areaReflejos = document.getElementById('area-reflejos');
    const txtScore = document.getElementById('score-reflejos');
    const txtTiempo = document.getElementById('tiempo-reflejos');
    const btnIniciarReflejos = document.getElementById('btn-iniciar-reflejos');

    let score = 0, tiempoRestante = 20;
    let intervaloTiempo = null, intervaloSpawn = null;
    let juegoActivo = false;

    function resetearReflejos() {
        clearInterval(intervaloTiempo);
        clearInterval(intervaloSpawn);
        juegoActivo = false;
        score = 0;
        tiempoRestante = 20;
        txtScore.textContent = score;
        txtTiempo.textContent = tiempoRestante;
        areaReflejos.innerHTML = '<p class="instruccion-game">Haz clic en "Iniciar Juego" para atrapar la mayor cantidad de flores antes de que se acabe el tiempo.</p>';
        btnIniciarReflejos.disabled = false;
    }

    function iniciarReflejos() {
        resetearReflejos();
        juegoActivo = true;
        btnIniciarReflejos.disabled = true;
        areaReflejos.innerHTML = '';

        intervaloTiempo = setInterval(() => {
            tiempoRestante--;
            txtTiempo.textContent = tiempoRestante;
            if (tiempoRestante <= 0) finalizarReflejos();
        }, 1000);

        intervaloSpawn = setInterval(aparecerFlor, 600);
    }

    function aparecerFlor() {
        if (!juegoActivo) return;

        const flor = document.createElement('span');
        flor.classList.add('item-reflejo');
        flor.textContent = Math.random() > 0.2 ? '🌻' : '⭐';

        const maxX = areaReflejos.clientWidth - 50;
        const maxY = areaReflejos.clientHeight - 50;

        flor.style.left = `${Math.random() * maxX}px`;
        flor.style.top = `${Math.random() * maxY}px`;

        flor.addEventListener('click', () => {
            if (!juegoActivo) return;
            score += flor.textContent === '⭐' ? 3 : 1;
            txtScore.textContent = score;
            flor.remove();
        });

        areaReflejos.appendChild(flor);

        setTimeout(() => {
            if (flor.parentElement) flor.remove();
        }, 1200);
    }

    function finalizarReflejos() {
        juegoActivo = false;
        clearInterval(intervaloTiempo);
        clearInterval(intervaloSpawn);
        areaReflejos.innerHTML = `<p class="instruccion-game">¡Tiempo agotado! ⏱️<br>Puntuación final: <strong>${score} puntos</strong></p>`;
        btnIniciarReflejos.disabled = false;
    }

    if (btnIniciarReflejos) btnIniciarReflejos.addEventListener('click', iniciarReflejos);

    // Inicialización al cargar la página
    iniciarPuzzle();
});