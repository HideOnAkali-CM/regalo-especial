document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // 1. NAVEGACIÓN ENTRE PESTAÑAS
    // ============================================================

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

        Object.values(tabs).forEach(tab => {
            if (tab) tab.classList.remove('active');
        });

        Object.values(paneles).forEach(panel => {
            if (panel) panel.classList.remove('activo');
        });

        if (tabs[nombre]) {
            tabs[nombre].classList.add('active');
        }

        if (paneles[nombre]) {
            paneles[nombre].classList.add('activo');
        }

        // Si salimos del puzzle
        if (nombre !== 'puzzle') {

            detenerFisicaPuzzle();

            const contenedor = document.getElementById(
                'contenedor-piezas-libres'
            );

            if (contenedor) {
                contenedor.innerHTML = '';
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


    // ============================================================
    // 2. ROMPECABEZAS
    // ============================================================

    const tablero = document.getElementById('tablero');

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


    // Configuración
    const FILAS = 3;
    const COLUMNAS = 3;

    let piezasFlotantes = [];
    let animacionFisicaFrame = null;
    let piezaSiendoArrastrada = null;

    let fotoSeleccionada = '../fotos/fotos1.jpg';

    // Tamaño real de las piezas
    let tamanoPieza = 80;


    // ============================================================
    // SELECCIÓN DE FOTOS
    // ============================================================

    tarjetasFoto.forEach(tarjeta => {

        tarjeta.addEventListener('click', () => {

            tarjetasFoto.forEach(t => {
                t.classList.remove('active');
            });

            tarjeta.classList.add('active');

            fotoSeleccionada = tarjeta.dataset.foto;
        });

    });


    // ============================================================
    // COMENZAR PUZZLE
    // ============================================================

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


    // ============================================================
    // CAMBIAR FOTO
    // ============================================================

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


    // ============================================================
    // INICIAR PUZZLE
    // ============================================================

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


        // --------------------------------------------------------
        // DRAG DESKTOP
        // --------------------------------------------------------

        document.body.ondragover = e => {
            e.preventDefault();
        };


        document.body.ondrop = e => {

            e.preventDefault();

            if (
                piezaSiendoArrastrada &&
                !e.target.closest('.espacio-puzzle')
            ) {

                const pieza = piezaSiendoArrastrada;

                const ancho =
                    pieza.dataset.tamano
                        ? parseFloat(pieza.dataset.tamano)
                        : tamanoPieza;

                const posX = Math.max(
                    10,
                    Math.min(
                        window.innerWidth - ancho - 10,
                        e.clientX - ancho / 2
                    )
                );

                const posY = Math.max(
                    60,
                    Math.min(
                        window.innerHeight - ancho - 10,
                        e.clientY - ancho / 2
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


        // --------------------------------------------------------
        // CREAR ESPACIOS DEL TABLERO
        // --------------------------------------------------------

        for (
            let i = 0;
            i < FILAS * COLUMNAS;
            i++
        ) {

            const espacio =
                document.createElement('div');

            espacio.classList.add('espacio-puzzle');

            espacio.dataset.indice = i;

            espacio.addEventListener(
                'dragover',
                e => e.preventDefault()
            );

            espacio.addEventListener(
                'drop',
                soltarPiezaEnTablero
            );

            tablero.appendChild(espacio);
        }


        // --------------------------------------------------------
        // CALCULAR TAMAÑO REAL
        // --------------------------------------------------------

        const primerEspacio =
            tablero.querySelector('.espacio-puzzle');

        tamanoPieza =
            primerEspacio
                ? primerEspacio.getBoundingClientRect().width
                : 80;


        // --------------------------------------------------------
        // CREAR PIEZAS
        // --------------------------------------------------------

        for (
            let i = 0;
            i < FILAS * COLUMNAS;
            i++
        ) {

            const pieza =
                document.createElement('div');

            pieza.classList.add('pieza-puzzle');

            pieza.draggable = true;

            pieza.id = `pieza-${i}`;

            pieza.dataset.indiceCorrecto = i;

            // IMPORTANTE:
            // Guardamos el tamaño original de la pieza.
            pieza.dataset.tamano = tamanoPieza;


            const fila =
                Math.floor(i / COLUMNAS);

            const columna =
                i % COLUMNAS;


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


            // ----------------------------------------------------
            // DRAG DESKTOP
            // ----------------------------------------------------

            pieza.addEventListener(
                'dragstart',
                () => {

                    piezaSiendoArrastrada = pieza;

                    piezasFlotantes =
                        piezasFlotantes.filter(
                            p => p.element !== pieza
                        );

                    // Al comenzar a sacar una pieza,
                    // restauramos su tamaño original.
                    restaurarTamanoPieza(pieza);
                }
            );


            // ----------------------------------------------------
            // TOUCH START
            // ----------------------------------------------------

            pieza.addEventListener(
                'touchstart',
                e => handleTouchStart(e, pieza),
                {
                    passive: false
                }
            );


            // ----------------------------------------------------
            // TOUCH MOVE
            // ----------------------------------------------------

            pieza.addEventListener(
                'touchmove',
                handleTouchMove,
                {
                    passive: false
                }
            );


            // ----------------------------------------------------
            // TOUCH END
            // ----------------------------------------------------

            pieza.addEventListener(
                'touchend',
                e => handleTouchEnd(e, pieza)
            );


            // Posición inicial
            const maxX =
                Math.max(
                    10,
                    window.innerWidth -
                    tamanoPieza -
                    20
                );

            const xInicial =
                Math.random() * maxX;

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


    // ============================================================
    // RESTAURAR TAMAÑO ORIGINAL
    // ============================================================
    // ESTA FUNCIÓN SOLUCIONA EL PROBLEMA DE LA FOTO
    // ============================================================

    function restaurarTamanoPieza(pieza) {

        const tamano =
            parseFloat(
                pieza.dataset.tamano
            ) || tamanoPieza;

        pieza.style.width =
            `${tamano}px`;

        pieza.style.height =
            `${tamano}px`;

        pieza.style.position =
            'fixed';

        pieza.style.backgroundSize =
            `${COLUMNAS * tamano}px ${FILAS * tamano}px`;

        pieza.style.boxSizing =
            'border-box';

        pieza.style.margin =
            '0';

    }


    // ============================================================
    // TOUCH
    // ============================================================

    let touchOffset = {
        x: 0,
        y: 0
    };


    function handleTouchStart(e, pieza) {

        if (e.cancelable) {
            e.preventDefault();
        }

        piezaSiendoArrastrada = pieza;


        // Sacamos la pieza de la física
        piezasFlotantes =
            piezasFlotantes.filter(
                p => p.element !== pieza
            );


        // IMPORTANTE:
        // Si estaba dentro de una casilla,
        // tenía width/height: 100%.
        // Lo devolvemos a su tamaño real.
        restaurarTamanoPieza(pieza);


        const touch =
            e.touches[0];

        const rect =
            pieza.getBoundingClientRect();


        touchOffset.x =
            touch.clientX -
            rect.left;

        touchOffset.y =
            touch.clientY -
            rect.top;


        pieza.style.position =
            'fixed';

        pieza.style.zIndex =
            '1000';

        pieza.style.left =
            `${touch.clientX - touchOffset.x}px`;

        pieza.style.top =
            `${touch.clientY - touchOffset.y}px`;

    }


    function handleTouchMove(e) {

        if (!piezaSiendoArrastrada) {
            return;
        }

        if (e.cancelable) {
            e.preventDefault();
        }

        const touch =
            e.touches[0];


        const pieza =
            piezaSiendoArrastrada;


        const tamano =
            parseFloat(
                pieza.dataset.tamano
            ) || tamanoPieza;


        let x =
            touch.clientX -
            touchOffset.x;

        let y =
            touch.clientY -
            touchOffset.y;


        // Evitar que la pieza salga de la pantalla
        x = Math.max(
            0,
            Math.min(
                window.innerWidth -
                tamano,
                x
            )
        );

        y = Math.max(
            0,
            Math.min(
                window.innerHeight -
                tamano,
                y
            )
        );


        pieza.style.left =
            `${x}px`;

        pieza.style.top =
            `${y}px`;
    }


    function handleTouchEnd(e, pieza) {

        if (!piezaSiendoArrastrada) {
            return;
        }


        const touch =
            e.changedTouches[0];


        // Ocultamos temporalmente la pieza
        // para detectar correctamente qué casilla está debajo.
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


        if (espacioDestino) {

            colocarPiezaEnCasilla(
                pieza,
                espacioDestino
            );

        } else {

            const tamano =
                parseFloat(
                    pieza.dataset.tamano
                ) || tamanoPieza;


            const posX =
                Math.max(
                    10,
                    Math.min(
                        window.innerWidth -
                        tamano -
                        10,
                        touch.clientX -
                        tamano / 2
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
                        tamano / 2
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


    // ============================================================
    // SOLTAR PIEZA EN TABLERO
    // ============================================================

    function soltarPiezaEnTablero(e) {

        e.preventDefault();
        e.stopPropagation();


        const pieza =
            piezaSiendoArrastrada;


        if (!pieza) {
            return;
        }


        const espacioDestino =
            e.target.closest(
                '.espacio-puzzle'
            );


        if (espacioDestino) {

            colocarPiezaEnCasilla(
                pieza,
                espacioDestino
            );
        }
    }


    // ============================================================
    // COLOCAR PIEZA EN CASILLA
    // ============================================================

    function colocarPiezaEnCasilla(
        pieza,
        espacioDestino
    ) {

        // --------------------------------------------------------
        // SI YA HAY UNA PIEZA
        // --------------------------------------------------------

        if (
            espacioDestino.children.length > 0
        ) {

            const piezaExistente =
                espacioDestino.firstElementChild;


            if (
                piezaExistente &&
                piezaExistente !== pieza
            ) {

                // Guardamos la posición ANTES
                // de sacar la pieza.
                const rect =
                    espacioDestino.getBoundingClientRect();


                // IMPORTANTE:
                // La pieza existente vuelve a ser
                // una pieza flotante normal.
                liberarPiezaConGravedad(
                    piezaExistente,
                    rect.left,
                    rect.top
                );
            }
        }


        // --------------------------------------------------------
        // QUITAR LA PIEZA DE LA FÍSICA
        // --------------------------------------------------------

        piezasFlotantes =
            piezasFlotantes.filter(
                p => p.element !== pieza
            );


        // --------------------------------------------------------
        // COLOCAR EN LA CASILLA
        // --------------------------------------------------------

        espacioDestino.appendChild(
            pieza
        );


        pieza.style.position =
            'absolute';

        pieza.style.left =
            '0px';

        pieza.style.top =
            '0px';

        pieza.style.width =
            '100%';

        pieza.style.height =
            '100%';

        pieza.style.zIndex =
            '2';


        piezaSiendoArrastrada =
            null;


        verificarVictoriaPuzzle();
    }


    // ============================================================
    // LIBERAR PIEZA
    // ============================================================

    function liberarPiezaConGravedad(
        pieza,
        x,
        y
    ) {

        if (!pieza || !contenedorPiezasLibres) {
            return;
        }


        // --------------------------------------------------------
        // QUITAR DE CUALQUIER CASILLA
        // --------------------------------------------------------

        contenedorPiezasLibres.appendChild(
            pieza
        );


        // --------------------------------------------------------
        // MUY IMPORTANTE:
        // RESTAURAR EL TAMAÑO ORIGINAL
        // --------------------------------------------------------

        restaurarTamanoPieza(
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


        const tamano =
            parseFloat(
                pieza.dataset.tamano
            ) || tamanoPieza;


        // --------------------------------------------------------
        // CREAR OBJETO FÍSICO
        // --------------------------------------------------------

        const objetoFisico = {

            element: pieza,

            x: x,

            y: y,

            velocidadY:
                0.2 +
                Math.random() *
                0.2,

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
                p => p.element !== pieza
            );


        piezasFlotantes.push(
            objetoFisico
        );
    }


    // ============================================================
    // FÍSICA DE LAS PIEZAS
    // ============================================================

    function loopFisica() {

        piezasFlotantes.forEach(item => {

            if (
                !item.element ||
                !item.element.parentElement
            ) {
                return;
            }


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
                parseFloat(
                    item.element.dataset.tamano
                ) || tamanoPieza;


            // Limite izquierdo
            if (item.x < 5) {
                item.x = 5;
            }


            // Limite derecho
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
            // vuelve arriba.
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
        });


        animacionFisicaFrame =
            requestAnimationFrame(
                loopFisica
            );
    }


    // ============================================================
    // DETENER FÍSICA
    // ============================================================

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


    // ============================================================
    // COMPROBAR VICTORIA
    // ============================================================

    function verificarVictoriaPuzzle() {

        const espacios =
            tablero.querySelectorAll(
                '.espacio-puzzle'
            );


        let completado = true;


        espacios.forEach(espacio => {

            const pieza =
                espacio.firstElementChild;


            if (
                !pieza ||
                Number(
                    pieza.dataset.indiceCorrecto
                ) !==
                Number(
                    espacio.dataset.indice
                )
            ) {

                completado = false;
            }

        });


        if (completado) {

            detenerFisicaPuzzle();


            setTimeout(() => {

                alert(
                    '¡Felicitaciones! Armaste la imagen correctamente. 💐💛'
                );

            }, 100);
        }
    }


    // ============================================================
    // REINICIAR PUZZLE
    // ============================================================

    if (btnReiniciarPuzzle) {

        btnReiniciarPuzzle.addEventListener(
            'click',
            iniciarPuzzle
        );
    }



    // ============================================================
    // 3. JUEGO DE MEMORIA
    // ============================================================

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
            [
                ...EMOJIS,
                ...EMOJIS
            ].sort(
                () => Math.random() - 0.5
            );


        movimientos = 0;

        paresEncontrados = 0;

        primeraCarta = null;

        segundaCarta = null;

        bloqueado = false;


        if (txtMovimientos) {
            txtMovimientos.textContent =
                movimientos;
        }


        if (txtPares) {
            txtPares.textContent =
                `0 / ${EMOJIS.length}`;
        }


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



    // ============================================================
    // 4. JUEGO DE REFLEJOS
    // ============================================================

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
                    Haz clic en "Iniciar Juego" para atrapar
                    la mayor cantidad de flores antes de que
                    se acabe el tiempo.
                </p>
            `;
        }


        if (btnIniciarReflejos) {
            btnIniciarReflejos.disabled =
                false;
        }
    }


    function iniciarReflejos() {

        resetearReflejos();

        juegoActivo = true;


        if (btnIniciarReflejos) {
            btnIniciarReflejos.disabled =
                true;
        }


        if (areaReflejos) {
            areaReflejos.innerHTML = '';
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
                areaReflejos.clientWidth - 50
            );


        const maxY =
            Math.max(
                0,
                areaReflejos.clientHeight - 50
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


                score +=
                    flor.textContent === '⭐'
                        ? 3
                        : 1;


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
                    <strong>
                        ¡Tiempo agotado! ⏱️
                    </strong>
                </p>

                <p>
                    Puntuación final:
                    ${score} puntos
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
