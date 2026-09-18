document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GESTIÓN DE NAVEGACIÓN Y SECCIONES ---
    const secciones = {
        menu: document.getElementById('sec-menu'),
        juegos: document.getElementById('sec-juegos'),
        recuerdos: document.getElementById('sec-recuerdos'),
        fotos: document.getElementById('sec-fotos')
    };

    const botonesNav = {
        menu: document.getElementById('nav-menu'),
        juegos: document.getElementById('nav-juegos'),
        recuerdos: document.getElementById('nav-recuerdos'),
        fotos: document.getElementById('nav-fotos')
    };

    function cambiarSeccion(nombreSeccion) {
        Object.values(secciones).forEach(sec => sec.classList.remove('activa'));
        Object.values(botonesNav).forEach(btn => btn.classList.remove('active'));

        secciones[nombreSeccion].classList.add('activa');
        botonesNav[nombreSeccion].classList.add('active');

        if (nombreSeccion === 'juegos') {
            iniciarJuego();
        } else {
            document.getElementById('contenedor-piezas-libres').innerHTML = '';
        }
    }

    botonesNav.menu.addEventListener('click', () => cambiarSeccion('menu'));
    botonesNav.juegos.addEventListener('click', () => cambiarSeccion('juegos'));
    botonesNav.recuerdos.addEventListener('click', () => cambiarSeccion('recuerdos'));
    botonesNav.fotos.addEventListener('click', () => cambiarSeccion('fotos'));
    document.getElementById('logo-inicio').addEventListener('click', () => cambiarSeccion('menu'));

    document.getElementById('card-juegos').addEventListener('click', () => cambiarSeccion('juegos'));
    document.getElementById('card-recuerdos').addEventListener('click', () => cambiarSeccion('recuerdos'));
    document.getElementById('card-fotos').addEventListener('click', () => cambiarSeccion('fotos'));


    // --- 2. FONDO ANIMADO CON ESTRELLAS Y PLANETAS ---
    const canvas = document.getElementById('fondo-espacial');
    const ctx = canvas.getContext('2d');

    let estrellas = [];
    let planetas = [];
    const NUM_ESTRELLAS = 140;

    function redimensionarCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    redimensionarCanvas();
    window.addEventListener('resize', redimensionarCanvas);

    for (let i = 0; i < NUM_ESTRELLAS; i++) {
        estrellas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radio: Math.random() * 1.6 + 0.4,
            velocidadY: Math.random() * 0.3 + 0.1,
            velocidadX: (Math.random() - 0.5) * 0.15,
            opacidad: Math.random() * 0.8 + 0.2
        });
    }

    planetas = [
        { x: canvas.width * 0.12, y: canvas.height * 0.22, radio: 45, colorBase: '#3498db', colorDetalle: '#1d6fa5', tieneAnillos: true, colorAnillo: 'rgba(244, 208, 63, 0.5)', velocidadX: 0.1, velocidadY: 0.03 },
        { x: canvas.width * 0.82, y: canvas.height * 0.72, radio: 60, colorBase: '#e74c3c', colorDetalle: '#962d22', tieneAnillos: false, colorAnillo: null, velocidadX: -0.08, velocidadY: -0.05 },
        { x: canvas.width * 0.88, y: canvas.height * 0.2, radio: 22, colorBase: '#f39c12', colorDetalle: '#a0600a', tieneAnillos: true, colorAnillo: 'rgba(230, 126, 34, 0.4)', velocidadX: -0.09, velocidadY: 0.04 }
    ];

    function dibujarPlaneta(p) {
        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.tieneAnillos) {
            ctx.beginPath();
            ctx.ellipse(0, 0, p.radio * 1.8, p.radio * 0.4, Math.PI / 6, Math.PI, Math.PI * 2);
            ctx.strokeStyle = p.colorAnillo;
            ctx.lineWidth = 6;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, p.radio, 0, Math.PI * 2);
        const gradiente = ctx.createRadialGradient(-p.radio * 0.3, -p.radio * 0.3, p.radio * 0.1, 0, 0, p.radio);
        gradiente.addColorStop(0, p.colorBase);
        gradiente.addColorStop(1, p.colorDetalle);
        ctx.fillStyle = gradiente;
        ctx.shadowColor = p.colorBase;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.tieneAnillos) {
            ctx.beginPath();
            ctx.ellipse(0, 0, p.radio * 1.8, p.radio * 0.4, Math.PI / 6, 0, Math.PI);
            ctx.strokeStyle = p.colorAnillo;
            ctx.lineWidth = 6;
            ctx.stroke();
        }

        ctx.restore();
    }

    function animarFondo() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        estrellas.forEach(estrella => {
            ctx.beginPath();
            ctx.arc(estrella.x, estrella.y, estrella.radio, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${estrella.opacidad})`;
            ctx.fill();

            estrella.y += estrella.velocidadY;
            estrella.x += estrella.velocidadX;

            if (estrella.y > canvas.height) estrella.y = 0;
        });

        planetas.forEach(p => {
            dibujarPlaneta(p);
            p.x += p.velocidadX;
            p.y += p.velocidadY;
        });

        requestAnimationFrame(animarFondo);
    }
    animarFondo();


    // --- 3. LÓGICA DEL ROMPECABEZAS ---
    const tablero = document.getElementById('tablero');
    const contenedorPiezasLibres = document.getElementById('contenedor-piezas-libres');
    const btnReiniciar = document.getElementById('btn-reiniciar');

    const FILAS = 3;
    const COLUMNAS = 3;
    const TAMANO_PIEZA = 100;

    function crearRutaAmpliaYDelicada(id) {
        const anchoVentana = window.innerWidth - 120;
        const altoVentana = window.innerHeight - 180;

        const p1X = (Math.random() * (anchoVentana * 0.4)).toFixed(0);
        const p1Y = (Math.random() * (altoVentana * 0.4)).toFixed(0);
        const p2X = (anchoVentana * 0.6 + Math.random() * (anchoVentana * 0.4)).toFixed(0);
        const p2Y = (Math.random() * (altoVentana * 0.5)).toFixed(0);

        const nombreAnimacion = `ruta-delicada-${id}`;
        const keyframes = `
            @keyframes ${nombreAnimacion} {
                0% { left: ${p1X}px; top: ${p1Y}px; transform: rotate(0deg); }
                50% { left: ${p2X}px; top: ${p2Y}px; transform: rotate(8deg); }
                100% { left: ${p1X}px; top: ${p1Y}px; transform: rotate(0deg); }
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.innerText = keyframes;
        document.head.appendChild(styleSheet);

        return nombreAnimacion;
    }

    function iniciarJuego() {
        tablero.innerHTML = '';
        contenedorPiezasLibres.innerHTML = '';

        for (let i = 0; i < FILAS * COLUMNAS; i++) {
            const espacio = document.createElement('div');
            espacio.classList.add('espacio-puzzle');
            espacio.dataset.indice = i;
            espacio.addEventListener('dragover', (e) => e.preventDefault());
            espacio.addEventListener('drop', soltarPieza);
            tablero.appendChild(espacio);
        }

        for (let i = 0; i < FILAS * COLUMNAS; i++) {
            const pieza = document.createElement('div');
            pieza.classList.add('pieza-puzzle');
            pieza.draggable = true;
            pieza.id = `pieza-${i}`;
            pieza.dataset.indiceCorrecto = i;

            const fila = Math.floor(i / COLUMNAS);
            const columna = i % COLUMNAS;
            pieza.style.backgroundPosition = `${-columna * TAMANO_PIEZA}px ${-fila * TAMANO_PIEZA}px`;

            const animNombre = crearRutaAmpliaYDelicada(i);
            pieza.style.animation = `${animNombre} ${(16 + Math.random() * 8).toFixed(1)}s ease-in-out infinite`;

            pieza.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', e.target.id));

            contenedorPiezasLibres.appendChild(pieza);
        }
    }

    function soltarPieza(e) {
        e.preventDefault();
        const idPieza = e.dataTransfer.getData('text/plain');
        const pieza = document.getElementById(idPieza);
        const espacioDestino = e.target;

        if (espacioDestino.classList.contains('espacio-puzzle') && espacioDestino.children.length === 0) {
            espacioDestino.appendChild(pieza);
            verificarVictoria();
        }
    }

    function verificarVictoria() {
        const espacios = document.querySelectorAll('.espacio-puzzle');
        let completado = true;

        espacios.forEach(espacio => {
            const pieza = espacio.firstChild;
            if (!pieza || pieza.dataset.indiceCorrecto != espacio.dataset.indice) {
                completado = false;
            }
        });

        if (completado) {
            setTimeout(() => alert('¡Felicitaciones! Armaste el ramo de flores amarillas. 💐💛'), 100);
        }
    }

    btnReiniciar.addEventListener('click', iniciarJuego);
});