document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. NAVEGACIÓN ENTRE PESTAÑAS
    // =========================================================

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

        Object.values(tabs).forEach(t => {
            if (t) t.classList.remove('active');
        });

        Object.values(paneles).forEach(p => {
            if (p) p.classList.remove('activo');
        });

        if (tabs[nombre]) {
            tabs[nombre].classList.add('active');
        }

        if (paneles[nombre]) {
            paneles[nombre].classList.add('activo');
        }

        if (nombre !== 'puzzle') {

            detenerFisicaPuzzle();

            const contenedorPiezas =
                document.getElementById('contenedor-piezas-libres');

            if (contenedorPiezas) {
                contenedorPiezas.innerHTML = '';
            }

            document.body.ondragover = null;
            document.body.ondrop = null;
        }

        if (nombre === 'memoria') {
            iniciarMemoria();
        }

        if (nombre === 'reflejos') {
            resetearReflejos();
        }
    }


    if (tabs.puzzle) {
        tabs.puzzle.addEventListener('click', () => {
            activarTab('puzzle');
        });
    }

    if (tabs.memoria) {
        tabs.memoria.addEventListener('click', () => {
            activarTab('memoria');
        });
    }

    if (tabs.reflejos) {
        tabs.reflejos.addEventListener('click', () => {
            activarTab('reflejos');
        });
    }


    // =========================================================
    // 2. JUEGO 1 - ROMPECABEZAS
    // =========================================================

    const tablero =
        document.getElementById('tablero');

    const contenedorPiezasLibres =
        document.getElementById('contenedor-piezas-libres');

    const btnReiniciarPuzzle =
        document.getElementById('btn-reiniciar-puzzle');

    const tarjetasFoto =
        document.querySelectorAll('.tarjeta-foto');

    const btnComenzarPuzzle =
        document.getElementById('btn-comenzar-puzzle');

    const btnCambiarFoto =
        document.getElementById('btn-cambiar-foto');

    const fotoGuiaMini =
        document.getElementById('foto-guia-mini');

    const pantallaSeleccion =
        document.getElementById('pantalla-seleccion-puzzle');

    const pantallaJuego =
        document.getElementById('pantalla-juego-puzzle');


    const FILAS = 3;
    const COLUMNAS = 3;


    let piezasFlotantes = [];

    let animacionFisicaFrame = null;

    let piezaSiendoArrastrada = null;

    let fotoSeleccionada =
        '../fotos/fotos1.jpg';


    // =========================================================
    // SELECCIÓN DE FOTOS
    // =========================================================

    tarjetasFoto.forEach(tarjeta => {

        tarjeta.addEventListener('click', () => {

            tarjetasFoto.forEach(t => {
                t.classList.remove('active');
            });

            tarjeta.classList.add('active');

            fotoSeleccionada =
                tarjeta.dataset.foto;
        });

    });


    // =========================================================
    // COMENZAR PUZZLE
    // =========================================================

    if (btnComenzarPuzzle) {

        btnComenzarPuzzle.addEventListener('click', () => {

            if (pantallaSeleccion) {
                pantallaSeleccion.style.display = 'none';
            }

            if (pantallaJuego) {
                pantallaJuego.style.display = 'flex';
            }

            if (fotoGuiaMini) {
                fotoGuiaMini.src = fotoSeleccionada;
            }

            iniciarPuzzle();
        });
    }


    // =========================================================
    // CAMBIAR FOTO
    // =========================================================

    if (btnCambiarFoto) {

        btnCambiarFoto.addEventListener('click', () => {

            detenerFisicaPuzzle();

            if (contenedorPiezasLibres) {
                contenedorPiezasLibres.innerHTML = '';
            }

            if (pantallaJuego) {
                pantallaJuego.style.display = 'none';
            }

            if (pantallaSeleccion) {
                pantallaSeleccion.style.display = 'flex';
            }
        });
    }


    // =========================================================
    // INICIAR PUZZLE
    // =========================================================

    function iniciarPuzzle() {

        if (
            !fotoSeleccionada ||
            !tablero ||
            !contenedorPiezasLibres
        ) {
            return;
        }

        detenerFisicaPuzzle();

        tablero.innerHTML = '';

        contenedorPiezasLibres.innerHTML = '';

        piezasFlotantes = [];

        piezaSiendoArrastrada = null;


        // -----------------------------------------------------
        // DRAG & DROP DE COMPUTADOR
        // -----------------------------------------------------

        document.body.ondragover = e => {
            e.preventDefault();
        };


        document.body.ondrop = e => {

            e.preventDefault();

            if (
                piezaSiendoArrastrada &&
                !e.target.closest('.espacio-puzzle')
            ) {

                const pieza =
                    piezaSiendoArrastrada;

                restaurarTamanoPieza(pieza);

                const tamano =
                    pieza.offsetWidth || 80;

                const posX = Math.max(
                    10,
                    Math.min(
                        window.innerWidth - tamano - 10,
                        e.clientX - tamano / 2
                    )
                );

                const posY = Math.max(
                    60,
                    Math.min(
                        window.innerHeight - tamano - 10,
                        e.clientY - tamano / 2
                    )
                );

                liberarPiezaConGravedad(
                    pieza,
                    posX,
                    posY
                );

                piezaSiendoArrastrada = null;
            }
        };


        // =====================================================
        // CREAR ESPACIOS DEL TABLERO
        // =====================================================

        for (
            let i = 0;
            i < FILAS * COLUMNAS;
            i++
        ) {

            const espacio =
                document.createElement('div');

            espacio.classList.add(
                'espacio-puzzle'
            );

            espacio.dataset.indice = i;


            espacio.addEventListener(
                'dragover',
                e => {
                    e.preventDefault();
                }
            );


            espacio.addEventListener(
                'drop',
                soltarPiezaEnTablero
            );


            tablero.appendChild(espacio);
        }


        // =====================================================
        // CALCULAR TAMAÑO DE PIEZA
        // =====================================================

        const primerEspacio =
            tablero.querySelector(
                '.espacio-puzzle'
            );


        const tamanoPieza =
            primerEspacio
                ? primerEspacio.clientWidth
                : 80;


        // =====================================================
        // CREAR LAS 9 PIEZAS
        // =====================================================

        for (
            let i = 0;
            i < FILAS * COLUMNAS;
            i++
        ) {

            const pieza =
                document.createElement('div');


            pieza.classList.add(
                'pieza-puzzle'
            );


            pieza.draggable = true;


            pieza.id =
                `pieza-${i}`;


            pieza.dataset.indiceCorrecto =
                i;


            const fila =
                Math.floor(i / COLUMNAS);


            const columna =
                i % COLUMNAS;


            // -------------------------------------------------
            // IMAGEN
            // -------------------------------------------------

            pieza.style.backgroundImage =
                `url("${fotoSeleccionada}")`;


            pieza.style.backgroundSize =
                `${COLUMNAS * tamanoPieza}px ${FILAS * tamanoPieza}px`;


            pieza.style.backgroundPosition =
                `${-columna * tamanoPieza}px ${-fila * tamanoPieza}px`;


            pieza.style.width =
                `${tamanoPieza}px`;


            pieza.style.height =
                `${tamanoPieza}px`;


            pieza.dataset.tamano =
                tamanoPieza;


            // -------------------------------------------------
            // DRAG DESKTOP
            // -------------------------------------------------

            pieza.addEventListener(
                'dragstart',
                () => {

                    piezaSiendoArrastrada =
                        pieza;


                    piezasFlotantes =
                        piezasFlotantes.filter(
                            p =>
                                p.element !== pieza
                        );


                    // IMPORTANTE:
                    // Si estaba dentro del tablero
                    // tenía width/height 100%.
                    // Aquí recuperamos su tamaño.
                    restaurarTamanoPieza(
                        pieza
                    );
                }
            );


            // -------------------------------------------------
            // TOUCH MOBILE
            // -------------------------------------------------

            pieza.addEventListener(
                'touchstart',
                e => {
                    handleTouchStart(
                        e,
                        pieza
                    );
                },
                {
                    passive: false
                }
            );


            pieza.addEventListener(
                'touchmove',
                handleTouchMove,
                {
                    passive: false
                }
            );


            pieza.addEventListener(
                'touchend',
                e => {
                    handleTouchEnd(
                        e,
                        pieza
                    );
                }
            );


            // -------------------------------------------------
            // POSICIÓN INICIAL
            // -------------------------------------------------

            const xInicial =
                Math.random() *
                Math.max(
                    10,
                    window.innerWidth -
                    tamanoPieza -
                    20
                );


            const yInicial =
                Math.random() *
                (window.innerHeight * 0.25) +
                60;


            liberarPiezaConGravedad(
                pieza,
                xInicial,
                yInicial
            );
        }


        loopFisica();
    }


    // =========================================================
    // VARIABLE PARA TOUCH
    // =========================================================

    let touchOffset = {
        x: 0,
        y: 0
    };


    // =========================================================
    // RESTAURAR TAMAÑO DE PIEZA
    // =========================================================
    //
    // ESTA ES LA CORRECCIÓN PRINCIPAL DEL PROBLEMA MÓVIL.
    //
    // Cuando una pieza está dentro del tablero usamos:
    //
    // width: 100%;
    // height: 100%;
    //
    // Al sacarla debemos volver a poner su tamaño real.
    // =========================================================

    function restaurarTamanoPieza(pieza) {

        if (!pieza) {
            return;
        }


        let tamano =
            parseFloat(
                pieza.dataset.tamano
            );


        // Si no tenemos el tamaño guardado,
        // lo calculamos desde el tablero.
        if (
            !tamano ||
            !isFinite(tamano)
        ) {

            const espacio =
                tablero
                    ? tablero.querySelector(
                        '.espacio-puzzle'
                    )
                    : null;


            tamano =
                espacio
                    ? espacio.clientWidth
                    : 80;
        }


        pieza.style.width =
            `${tamano}px`;


        pieza.style.height =
            `${tamano}px`;


        pieza.style.backgroundSize =
            `${COLUMNAS * tamano}px ${FILAS * tamano}px`;


        const indice =
            parseInt(
                pieza.dataset.indiceCorrecto,
                10
            );


        if (!isNaN(indice)) {

            const fila =
                Math.floor(
                    indice / COLUMNAS
                );


            const columna =
                indice % COLUMNAS;


            pieza.style.backgroundPosition =
                `${-columna * tamano}px ${-fila * tamano}px`;
        }
    }


    // =========================================================
    // TOUCH START
    // =========================================================

    function handleTouchStart(e, pieza) {

        if (e.cancelable) {
            e.preventDefault();
        }


        piezaSiendoArrastrada =
            pieza;


        // Sacar de la física
        piezasFlotantes =
            piezasFlotantes.filter(
                p =>
                    p.element !== pieza
            );


        const touch =
            e.touches[0];


        // Guardar posición antes de cambiar
        // position.
        const rect =
            pieza.getBoundingClientRect();


        touchOffset.x =
            touch.clientX -
            rect.left;


        touchOffset.y =
            touch.clientY -
            rect.top;


        // =====================================================
        // CORRECCIÓN DEL TAMAÑO
        // =====================================================

        restaurarTamanoPieza(
            pieza
        );


        // =====================================================
        // POSICIÓN FIJA PARA MOVER CON EL DEDO
        // =====================================================

        pieza.style.position =
            'fixed';


        pieza.style.zIndex =
            '1000';


        pieza.style.left =
            `${touch.clientX - touchOffset.x}px`;


        pieza.style.top =
            `${touch.clientY - touchOffset.y}px`;
    }


    // =========================================================
    // TOUCH MOVE
    // =========================================================

    function handleTouchMove(e) {

        if (!piezaSiendoArrastrada) {
            return;
        }


        if (e.cancelable) {
            e.preventDefault();
        }


        const touch =
            e.touches[0];


        piezaSiendoArrastrada.style.left =
            `${touch.clientX - touchOffset.x}px`;


        piezaSiendoArrastrada.style.top =
            `${touch.clientY - touchOffset.y}px`;
    }


    // =========================================================
    // TOUCH END
    // =========================================================

    function handleTouchEnd(e, pieza) {

        if (!piezaSiendoArrastrada) {
            return;
        }


        const touch =
            e.changedTouches[0];


        pieza.style.zIndex =
            '1000';


        // -----------------------------------------------------
        // Ocultar temporalmente la pieza para detectar
        // qué hay debajo del dedo.
        // -----------------------------------------------------

        pieza.style.display =
            'none';


        const elementoBajoCursor =
            document.elementFromPoint(
                touch.clientX,
                touch.clientY
            );


        pieza.style.display =
            'block';


        const espacioDestino =
            elementoBajoCursor
                ? elementoBajoCursor.closest(
                    '.espacio-puzzle'
                )
                : null;


        // -----------------------------------------------------
        // SI SOLTÓ SOBRE UNA CASILLA
        // -----------------------------------------------------

        if (espacioDestino) {

            colocarPiezaEnCasilla(
                pieza,
                espacioDestino
            );

        }

        // -----------------------------------------------------
        // SI SOLTÓ FUERA DEL TABLERO
        // -----------------------------------------------------

        else {

            restaurarTamanoPieza(
                pieza
            );


            const tamano =
                pieza.offsetWidth ||
                parseFloat(
                    pieza.dataset.tamano
                ) ||
                80;


            const posX =
                Math.max(
                    10,
                    Math.min(
                        window.innerWidth -
                        tamano -
                        10,
                        touch.clientX -
                        touchOffset.x
                    )
                );


            const posY =
                Math.max(
                    60,
                    Math.min(
                        window.innerHeight -
                        tamano -
                        10,
                        touch.clientY -
                        touchOffset.y
                    )
                );


            liberarPiezaConGravedad(
                pieza,
                posX,
                posY
            );
        }


        piezaSiendoArrastrada =
            null;
    }


    // =========================================================
    // LIBERAR PIEZA CON FÍSICA
    // =========================================================

    function liberarPiezaConGravedad(
        pieza,
        x,
        y
    ) {

        // =====================================================
        // MUY IMPORTANTE:
        // Restaurar tamaño ANTES de agregarla
        // al contenedor flotante.
        // =====================================================

        restaurarTamanoPieza(
            pieza
        );


        contenedorPiezasLibres.appendChild(
            pieza
        );


        pieza.style.animation =
            'none';


        pieza.style.position =
            'fixed';


        pieza.style.left =
            `${x}px`;


        pieza.style.top =
            `${y}px`;


        pieza.style.zIndex =
            '10';


        const objetoFisico = {

            element: pieza,

            x: x,

            y: y,

            velocidadY:
                0.2 +
                Math.random() * 0.2,

            balanceo:
                Math.random() *
                Math.PI *
                2,

            velocidadBalanceo:
                0.01 +
                Math.random() *
                0.01
        };


        piezasFlotantes =
            piezasFlotantes.filter(
                p =>
                    p.element !== pieza
            );


        piezasFlotantes.push(
            objetoFisico
        );
    }


    // =========================================================
    // FÍSICA
    // =========================================================

    function loopFisica() {

        piezasFlotantes.forEach(
            item => {

                item.y +=
                    item.velocidadY;


                item.balanceo +=
                    item.velocidadBalanceo;


                const oscilacionX =
                    Math.sin(
                        item.balanceo
                    ) * 0.4;


                item.x +=
                    oscilacionX;


                const anchoPieza =
                    item.element.offsetWidth ||
                    parseFloat(
                        item.element.dataset.tamano
                    ) ||
                    80;


                // Límite izquierdo
                if (item.x < 5) {
                    item.x = 5;
                }


                // Límite derecho
                if (
                    item.x >
                    window.innerWidth -
                    anchoPieza -
                    5
                ) {

                    item.x =
                        window.innerWidth -
                        anchoPieza -
                        5;
                }


                // Cuando llega abajo,
                // vuelve a aparecer arriba.
                if (
                    item.y >
                    window.innerHeight -
                    anchoPieza -
                    20
                ) {

                    item.y =
                        -anchoPieza;


                    item.x =
                        Math.random() *
                        Math.max(
                            10,
                            window.innerWidth -
                            anchoPieza -
                            10
                        );
                }


                item.element.style.top =
                    `${item.y}px`;


                item.element.style.left =
                    `${item.x}px`;
            }
        );


        animacionFisicaFrame =
            requestAnimationFrame(
                loopFisica
            );
    }


    // =========================================================
    // DETENER FÍSICA
    // =========================================================

    function detenerFisicaPuzzle() {

        if (animacionFisicaFrame) {

            cancelAnimationFrame(
                animacionFisicaFrame
            );

            animacionFisicaFrame =
                null;
        }


        piezasFlotantes = [];
    }


    // =========================================================
    // SOLTAR PIEZA EN TABLERO - DESKTOP
    // =========================================================

    function soltarPiezaEnTablero(e) {

        e.preventDefault();

        e.stopPropagation();


        const piezaArrastrada =
            piezaSiendoArrastrada;


        if (!piezaArrastrada) {
            return;
        }


        const espacioDestino =
            e.target.closest(
                '.espacio-puzzle'
            );


        if (espacioDestino) {

            colocarPiezaEnCasilla(
                piezaArrastrada,
                espacioDestino
            );
        }
    }


    // =========================================================
    // COLOCAR PIEZA EN CASILLA
    // =========================================================

    function colocarPiezaEnCasilla(
        pieza,
        espacioDestino
    ) {

        // -----------------------------------------------------
        // Si ya hay una pieza en esa casilla,
        // la sacamos.
        // -----------------------------------------------------

        if (
            espacioDestino.children.length > 0
        ) {

            const piezaExistente =
                espacioDestino.firstChild;


            if (
                piezaExistente !== pieza
            ) {

                const rect =
                    espacioDestino.getBoundingClientRect();


                // Restaurar tamaño antes
                // de convertirla en flotante.
                restaurarTamanoPieza(
                    piezaExistente
                );


                liberarPiezaConGravedad(
                    piezaExistente,
                    rect.left,
                    rect.top
                );
            }
        }


        // Quitar de la física
        piezasFlotantes =
            piezasFlotantes.filter(
                p =>
                    p.element !== pieza
            );


        // Colocar dentro de la casilla
        espacioDestino.appendChild(
            pieza
        );


        // =====================================================
        // DENTRO DEL TABLERO SÍ QUEREMOS 100%
        // =====================================================

        pieza.style.position =
            'absolute';


        pieza.style.left =
            '0';


        pieza.style.top =
            '0';


        pieza.style.width =
            '100%';


        pieza.style.height =
            '100%';


        pieza.style.zIndex =
            '10';


        piezaSiendoArrastrada =
            null;


        verificarVictoriaPuzzle();
    }


    // =========================================================
    // COMPROBAR VICTORIA
    // =========================================================

    function verificarVictoriaPuzzle() {

        const espacios =
            document.querySelectorAll(
                '.espacio-puzzle'
            );


        let completado = true;


        espacios.forEach(
            espacio => {

                const pieza =
                    espacio.firstChild;


                if (
                    !pieza ||
                    pieza.dataset.indiceCorrecto !=
                    espacio.dataset.indice
                ) {

                    completado = false;
                }
            }
        );


        if (completado) {

            detenerFisicaPuzzle();


            setTimeout(() => {

                alert(
                    '¡Felicitaciones! Armaste la imagen correctamente. 💐💛'
                );

            }, 100);
        }
    }


    // =========================================================
    // REINICIAR PUZZLE
    // =========================================================

    if (btnReiniciarPuzzle) {

        btnReiniciarPuzzle.addEventListener(
            'click',
            iniciarPuzzle
        );
    }


    // =========================================================
    // 3. JUEGO DE MEMORIA
    // =========================================================

    const gridMemoria =
        document.getElementById(
            'grid-memoria'
        );


    const txtMovimientos =
        document.getElementById(
            'movimientos-memoria'
        );


    const txtPares =
        document.getElementById(
            'pares-memoria'
        );


    const btnReiniciarMemoria =
        document.getElementById(
            'btn-reiniciar-memoria'
        );


    const EMOJIS = [
        '🌻',
        '🌹',
        '🌷',
        '🌸',
        '🌼',
        '🌺'
    ];


    let cartasMemoria = [];

    let primeraCarta = null;

    let segundaCarta = null;

    let bloqueado = false;

    let movimientos = 0;

    let paresEncontrados = 0;


    function iniciarMemoria() {

        if (!gridMemoria) {
            return;
        }


        gridMemoria.innerHTML = '';


        cartasMemoria =
            [...EMOJIS, ...EMOJIS]
                .sort(
                    () =>
                        Math.random() - 0.5
                );


        movimientos = 0;

        paresEncontrados = 0;


        if (txtMovimientos) {
            txtMovimientos.textContent =
                movimientos;
        }


        if (txtPares) {
            txtPares.textContent =
                `0 / ${EMOJIS.length}`;
        }


        primeraCarta = null;

        segundaCarta = null;

        bloqueado = false;


        cartasMemoria.forEach(
            (emoji, index) => {

                const carta =
                    document.createElement(
                        'div'
                    );


                carta.classList.add(
                    'carta-memoria'
                );


                carta.dataset.emoji =
                    emoji;


                carta.dataset.index =
                    index;


                carta.textContent =
                    '❓';


                carta.addEventListener(
                    'click',
                    voltearCarta
                );


                gridMemoria.appendChild(
                    carta
                );
            }
        );
    }


    function voltearCarta(e) {

        const carta =
            e.currentTarget;


        if (
            bloqueado ||
            carta === primeraCarta ||
            carta.classList.contains(
                'emparejada'
            )
        ) {
            return;
        }


        carta.textContent =
            carta.dataset.emoji;


        carta.classList.add(
            'revelada'
        );


        if (!primeraCarta) {

            primeraCarta =
                carta;

        } else {

            segundaCarta =
                carta;


            movimientos++;


            if (txtMovimientos) {
                txtMovimientos.textContent =
                    movimientos;
            }


            verificarPareja();
        }
    }


    function verificarPareja() {

        if (
            primeraCarta.dataset.emoji ===
            segundaCarta.dataset.emoji
        ) {

            primeraCarta.classList.add(
                'emparejada'
            );


            segundaCarta.classList.add(
                'emparejada'
            );


            paresEncontrados++;


            if (txtPares) {

                txtPares.textContent =
                    `${paresEncontrados} / ${EMOJIS.length}`;
            }


            resetearSeleccion();


            if (
                paresEncontrados ===
                EMOJIS.length
            ) {

                setTimeout(() => {

                    alert(
                        `¡Increíble! Ganaste el juego de memoria en ${movimientos} movimientos. 🧠✨`
                    );

                }, 200);
            }

        } else {

            bloqueado = true;


            setTimeout(() => {

                if (primeraCarta) {

                    primeraCarta.textContent =
                        '❓';


                    primeraCarta.classList.remove(
                        'revelada'
                    );
                }


                if (segundaCarta) {

                    segundaCarta.textContent =
                        '❓';


                    segundaCarta.classList.remove(
                        'revelada'
                    );
                }


                resetearSeleccion();

            }, 800);
        }
    }


    function resetearSeleccion() {

        primeraCarta = null;

        segundaCarta = null;

        bloqueado = false;
    }


    if (btnReiniciarMemoria) {

        btnReiniciarMemoria.addEventListener(
            'click',
            iniciarMemoria
        );
    }


    // =========================================================
    // 4. JUEGO DE REFLEJOS
    // =========================================================

    const areaReflejos =
        document.getElementById(
            'area-reflejos'
        );


    const txtScore =
        document.getElementById(
            'score-reflejos'
        );


    const txtTiempo =
        document.getElementById(
            'tiempo-reflejos'
        );


    const btnIniciarReflejos =
        document.getElementById(
            'btn-iniciar-reflejos'
        );


    let score = 0;

    let tiempoRestante = 20;

    let intervaloTiempo = null;

    let intervaloSpawn = null;

    let juegoActivo = false;


    // =========================================================
    // RESETEAR REFLEJOS
    // =========================================================

    function resetearReflejos() {

        clearInterval(
            intervaloTiempo
        );

        clearInterval(
            intervaloSpawn
        );


        juegoActivo = false;

        score = 0;

        tiempoRestante = 20;


        if (txtScore) {
            txtScore.textContent =
                score;
        }


        if (txtTiempo) {
            txtTiempo.textContent =
                tiempoRestante;
        }


        if (areaReflejos) {

            areaReflejos.innerHTML = `
                <p>
                    Haz clic en "Iniciar Juego"
                    para atrapar la mayor cantidad
                    de flores antes de que se acabe
                    el tiempo.
                </p>
            `;
        }


        if (btnIniciarReflejos) {
            btnIniciarReflejos.disabled =
                false;
        }
    }


    // =========================================================
    // INICIAR REFLEJOS
    // =========================================================

    function iniciarReflejos() {

        resetearReflejos();

        juegoActivo = true;


        if (btnIniciarReflejos) {
            btnIniciarReflejos.disabled =
                true;
        }


        if (areaReflejos) {
            areaReflejos.innerHTML =
                '';
        }


        intervaloTiempo =
            setInterval(() => {

                tiempoRestante--;


                if (txtTiempo) {
                    txtTiempo.textContent =
                        tiempoRestante;
                }


                if (
                    tiempoRestante <= 0
                ) {

                    finalizarReflejos();
                }

            }, 1000);


        intervaloSpawn =
            setInterval(
                aparecerFlor,
                600
            );
    }


    // =========================================================
    // APARECER FLOR
    // =========================================================

    function aparecerFlor() {

        if (
            !juegoActivo ||
            !areaReflejos
        ) {
            return;
        }


        const flor =
            document.createElement(
                'span'
            );


        flor.classList.add(
            'item-reflejo'
        );


        flor.textContent =
            Math.random() > 0.2
                ? '🌻'
                : '⭐';


        const maxX =
            Math.max(
                0,
                areaReflejos.clientWidth -
                50
            );


        const maxY =
            Math.max(
                0,
                areaReflejos.clientHeight -
                50
            );


        flor.style.left =
            `${Math.random() * maxX}px`;


        flor.style.top =
            `${Math.random() * maxY}px`;


        flor.addEventListener(
            'click',
            () => {

                if (!juegoActivo) {
                    return;
                }


                if (
                    flor.textContent ===
                    '⭐'
                ) {

                    score += 3;

                } else {

                    score += 1;
                }


                if (txtScore) {
                    txtScore.textContent =
                        score;
                }


                flor.remove();
            }
        );


        areaReflejos.appendChild(
            flor
        );


        setTimeout(() => {

            if (flor.parentElement) {
                flor.remove();
            }

        }, 1200);
    }


    // =========================================================
    // FINALIZAR REFLEJOS
    // =========================================================

    function finalizarReflejos() {

        juegoActivo = false;


        clearInterval(
            intervaloTiempo
        );


        clearInterval(
            intervaloSpawn
        );


        if (areaReflejos) {

            areaReflejos.innerHTML = `
                <p>
                    ¡Tiempo agotado! ⏱️
                </p>

                <p>
                    Puntuación final:
                    <strong>
                        ${score}
                    </strong>
                    puntos
                </p>
            `;
        }


        if (btnIniciarReflejos) {
            btnIniciarReflejos.disabled =
                false;
        }
    }


    if (btnIniciarReflejos) {

        btnIniciarReflejos.addEventListener(
            'click',
            iniciarReflejos
        );
    }

});
