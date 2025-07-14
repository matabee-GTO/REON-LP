document.addEventListener('DOMContentLoaded', () => {

    // Background Animation
    const canvas = document.getElementById('background-animation');
    const ctx = canvas.getContext('2d');

    let width, height;
    let lines = [];
    const lineCount = 20; // Adjust for density
    const colors = ['#888888', '#00BFFF'];

    function init() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        lines = [];
        for (let i = 0; i < lineCount; i++) {
            lines.push(new Line());
        }
    }

    class Line {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.length = Math.random() * 300 + 150; // Line length
            this.angle = Math.random() * Math.PI * 2;
            this.speed = Math.random() * 0.8 + 0.3; // Faster speed
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.alpha = 0;
            this.fadeSpeed = Math.random() * 0.02 + 0.01;
            this.isFadingIn = true;
        }

        update() {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;

            if (this.isFadingIn) {
                this.alpha += this.fadeSpeed;
                if (this.alpha >= 0.5) { // Max opacity
                    this.alpha = 0.5;
                    this.isFadingIn = false;
                }
            } else {
                 if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                    this.alpha -= this.fadeSpeed;
                 }
            }
            
            if (this.alpha <= 0) {
                this.reset();
            }
        }

        reset() {
            Object.assign(this, new Line());
        }

        draw() {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            const endX = this.x + Math.cos(this.angle) * this.length;
            const endY = this.y + Math.sin(this.angle) * this.length;
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = this.alpha;
            ctx.stroke();
            ctx.closePath();
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        ctx.globalAlpha = 1; // Reset global alpha

        lines.forEach(line => {
            line.update();
            line.draw();
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);

    init();
    animate();

    // Smooth scroll for anchor links
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = ctaButton.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Intersection Observer for content sections
    const sections = document.querySelectorAll('.content-section');
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, options);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Audio Player
    const audioPlayer = document.getElementById('audio-player');
    let currentPlayingTrack = null;

    function setupTrack(trackId, audioSrc) {
        const playTrackLink = document.getElementById(trackId);
        const playIndicator = document.getElementById(trackId.replace('play-track', 'play-indicator'));

        if(playTrackLink && audioPlayer && playIndicator) {
            const musicIcon = '<i class="fas fa-music"></i>';
            const playingText = '<span class="playing-text">PLAYING</span>';

            playIndicator.innerHTML = musicIcon;

            playTrackLink.addEventListener('click', (e) => {
                e.preventDefault();

                if (currentPlayingTrack && currentPlayingTrack !== playTrackLink) {
                    // Pause previously playing track
                    const prevIndicator = document.getElementById(currentPlayingTrack.id.replace('play-track', 'play-indicator'));
                    currentPlayingTrack.classList.remove('playing');
                    if (prevIndicator) prevIndicator.innerHTML = musicIcon;
                    audioPlayer.pause();
                }

                if (audioPlayer.paused || currentPlayingTrack !== playTrackLink) {
                    audioPlayer.src = audioSrc;
                    audioPlayer.play();
                    playTrackLink.classList.add('playing');
                    playIndicator.innerHTML = playingText;
                    currentPlayingTrack = playTrackLink;
                } else {
                    audioPlayer.pause();
                    playTrackLink.classList.remove('playing');
                    playIndicator.innerHTML = musicIcon;
                    currentPlayingTrack = null;
                }
            });

            audioPlayer.addEventListener('ended', () => {
                if (currentPlayingTrack === playTrackLink) {
                    playTrackLink.classList.remove('playing');
                    playIndicator.innerHTML = musicIcon;
                    currentPlayingTrack = null;
                }
            });
        }
    }

    setupTrack('play-track', 'assets/images/Metropolis Grid.mp3');
    setupTrack('play-track-subterranean', 'assets/images/Subterranean Echo.mp3');

    // Audio Visualizer
    const visualizerCanvas = document.getElementById('audio-visualizer');
    const visualizerCtx = visualizerCanvas.getContext('2d');
    let audioContext, analyser, source;
    let dataArray;
    let bufferLength;

    function setupAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256; // Adjust for detail
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
        }
    }

    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);

        if (audioPlayer.paused) {
            visualizerCanvas.style.display = 'none';
            return;
        }

        visualizerCanvas.style.display = 'block';
        visualizerCanvas.width = visualizerCanvas.offsetWidth;
        visualizerCanvas.height = visualizerCanvas.offsetHeight;

        analyser.getByteFrequencyData(dataArray);

        visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

        const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i];

            visualizerCtx.fillStyle = 'rgb(0, ' + (barHeight + 100) + ', 255)'; // Electric Blue
            visualizerCtx.fillRect(x, visualizerCanvas.height - barHeight / 2, barWidth, barHeight / 2);

            x += barWidth + 1;
        }
    }

    audioPlayer.addEventListener('play', () => {
        setupAudioContext();
        drawVisualizer();
    });

    audioPlayer.addEventListener('pause', () => {
        visualizerCanvas.style.display = 'none';
    });

    audioPlayer.addEventListener('ended', () => {
        visualizerCanvas.style.display = 'none';
    });

    // Cursor Trail Animation
    const cursorCanvas = document.getElementById('cursor-trail');
    const cursorCtx = cursorCanvas.getContext('2d');
    let particles = [];
    const particleCount = 10; // Number of particles per mouse move
    const particleColors = ['#00BFFF', '#888888'];

    function resizeCursorCanvas() {
        cursorCanvas.width = window.innerWidth;
        cursorCanvas.height = window.innerHeight;
    }

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 2 + 1; // Particle size
            this.speedX = Math.random() * 2 - 1; // Random speed in X
            this.speedY = Math.random() * 2 - 1; // Random speed in Y
            this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
            this.alpha = 1;
            this.life = 100; // Life in frames
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.alpha -= 0.01; // Fade out
            this.life--;
        }

        draw() {
            cursorCtx.globalAlpha = this.alpha;
            cursorCtx.fillStyle = this.color;
            cursorCtx.beginPath();
            cursorCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            cursorCtx.fill();
        }
    }

    function animateCursorTrail() {
        cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].life <= 0 || particles[i].alpha <= 0) {
                particles.splice(i, 1);
                i--;
            }
        }
        requestAnimationFrame(animateCursorTrail);
    }

    window.addEventListener('mousemove', (e) => {
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(e.clientX, e.clientY));
        }
    });

    window.addEventListener('resize', resizeCursorCanvas);

    resizeCursorCanvas();
    animateCursorTrail();

});
