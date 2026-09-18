document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fondo-espacial');
    if (!canvas) return;
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
});