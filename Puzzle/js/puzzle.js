document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const puzzleBoard = document.getElementById('puzzle-board');
    const piecesContainer = document.getElementById('pieces-container');
    const startButton = document.getElementById('start-btn');
    const resetButton = document.getElementById('reset-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('image-upload');
    const successMessage = document.getElementById('success-message');
    const timerElement = document.getElementById('timer');
    
    // Configuración del puzzle
    let PUZZLE_SIZE = 4; // Valor inicial: 4x4 puzzle
    let TOTAL_PIECES = PUZZLE_SIZE * PUZZLE_SIZE;
    
    // Variables para calcular tamaños responsive
    let PIECE_SIZE;
    let IMAGE_SIZE;
    
    // Selector de dificultad
    const puzzleSizeSelector = document.getElementById('puzzle-size');
    
    // Imagen del rompecabezas (por defecto usa un placeholder)
    let puzzleImage = '/img/images.png';
    
    // Variables para el timer
    let timerInterval;
    let seconds = 0;
    let minutes = 0;
    
    // Calcular tamaños basados en la ventana y el tamaño del puzzle
    function calculateSizes() {
        // Determinar el ancho disponible para el tablero
        let availableWidth = Math.min(window.innerWidth * 0.9, 400);
        
        // Ajustar el tamaño máximo según la dificultad
        // Piezas más pequeñas para puzzles más grandes
        const maxSize = PUZZLE_SIZE >= 6 ? 380 : 400;
        availableWidth = Math.min(availableWidth, maxSize);
        
        // Calcular el tamaño de cada pieza
        PIECE_SIZE = Math.floor(availableWidth / PUZZLE_SIZE);
        
        // Ajustar el tamaño total de la imagen
        IMAGE_SIZE = PIECE_SIZE * PUZZLE_SIZE;
        
        return { PIECE_SIZE, IMAGE_SIZE };
    }
    
    // Inicializar el tablero del puzzle
    function initPuzzleBoard() {
        const { PIECE_SIZE } = calculateSizes();
        
        puzzleBoard.innerHTML = '';
        puzzleBoard.style.gridTemplateColumns = `repeat(${PUZZLE_SIZE}, 1fr)`;
        puzzleBoard.style.gridTemplateRows = `repeat(${PUZZLE_SIZE}, 1fr)`;
        
        // Eliminar clases de tamaño antiguas
        puzzleBoard.classList.remove('size-3x3', 'size-4x4', 'size-5x5', 'size-6x6', 'size-7x7');
        piecesContainer.classList.remove('size-3x3', 'size-4x4', 'size-5x5', 'size-6x6', 'size-7x7');
        
        // Agregar clase de tamaño actual
        const sizeClass = `size-${PUZZLE_SIZE}x${PUZZLE_SIZE}`;
        puzzleBoard.classList.add(sizeClass);
        piecesContainer.classList.add(sizeClass);
        
        // Reducir el gap para puzzles grandes
        if (PUZZLE_SIZE >= 6) {
            puzzleBoard.style.gap = '1px';
        } else {
            puzzleBoard.style.gap = '2px';
        }
        
        for (let i = 0; i < TOTAL_PIECES; i++) {
            const slot = document.createElement('div');
            slot.classList.add('puzzle-piece-slot');
            slot.setAttribute('data-position', i);
            puzzleBoard.appendChild(slot);
        }
    }
    
    // Función para crear piezas según el tamaño del puzzle
    function createPieces(size) {
        const pieces = [];
        const totalPieces = size * size;
        for (let i = 0; i < totalPieces; i++) {
            pieces.push({
                id: i,
                correctPosition: i
            });
        }
        return pieces;
    }
    
    // Inicializamos las piezas
    let pieces = createPieces(PUZZLE_SIZE);
    
    // Función para iniciar el juego
    function startGame() {
        resetGame();
        
        // Actualizar tamaño del puzzle según la selección
        PUZZLE_SIZE = parseInt(puzzleSizeSelector.value);
        TOTAL_PIECES = PUZZLE_SIZE * PUZZLE_SIZE;
        
        // Recrear piezas para el nuevo tamaño
        pieces = createPieces(PUZZLE_SIZE);
        
        // Reinicializar el tablero con el nuevo tamaño
        initPuzzleBoard();
        
        // Recalcular tamaños para asegurar responsividad
        const { PIECE_SIZE, IMAGE_SIZE } = calculateSizes();
        
        // Iniciar el temporizador
        startTimer();
        
        // Renderizar piezas mezcladas
        const shuffledPieces = [...pieces].sort(() => Math.random() - 0.5);
        shuffledPieces.forEach((piece, index) => {
            const pieceElement = createPieceElement(piece, PIECE_SIZE, IMAGE_SIZE);
            piecesContainer.appendChild(pieceElement);
        });
        
        setupDragAndDrop();
    }
    
    // Función para reiniciar el juego
    function resetGame() {
        piecesContainer.innerHTML = '';
        const slots = document.querySelectorAll('.puzzle-piece-slot');
        slots.forEach(slot => {
            if (slot.querySelector('.puzzle-piece')) {
                slot.removeChild(slot.querySelector('.puzzle-piece'));
            }
        });
        
        // Reiniciar temporizador
        stopTimer();
        seconds = 0;
        minutes = 0;
        updateTimerDisplay();
        
        // Ocultar mensaje de éxito
        successMessage.style.display = 'none';
    }
    
    // Crear elemento de pieza del rompecabezas
    function createPieceElement(piece, pieceSize, imageSize) {
        const pieceElement = document.createElement('div');
        pieceElement.classList.add('puzzle-piece');
        pieceElement.setAttribute('draggable', 'true');
        pieceElement.setAttribute('data-id', piece.id);
        
        // Establecer dimensiones responsive
        pieceElement.style.width = `${pieceSize}px`;
        pieceElement.style.height = `${pieceSize}px`;
        
        // Crear un div para la imagen
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('puzzle-image');
        imageContainer.style.backgroundImage = `url(${puzzleImage})`;
        imageContainer.style.backgroundSize = `${imageSize}px ${imageSize}px`;
        
        // Calcular la posición de background
        const row = Math.floor(piece.id / PUZZLE_SIZE);
        const col = piece.id % PUZZLE_SIZE;
        imageContainer.style.backgroundPosition = `-${col * pieceSize}px -${row * pieceSize}px`;
        
        pieceElement.appendChild(imageContainer);
        return pieceElement;
    }
    
    // Configurar arrastrar y soltar
    function setupDragAndDrop() {
        const draggablePieces = document.querySelectorAll('.puzzle-piece');
        const dropSlots = document.querySelectorAll('.puzzle-piece-slot');
        
        // Configuración para dispositivos táctiles
        draggablePieces.forEach(piece => {
            piece.addEventListener('dragstart', dragStart);
            
            // Soporte para touch (móviles)
            piece.addEventListener('touchstart', handleTouchStart, { passive: false });
            piece.addEventListener('touchmove', handleTouchMove, { passive: false });
            piece.addEventListener('touchend', handleTouchEnd);
        });
        
        dropSlots.forEach(slot => {
            slot.addEventListener('dragover', dragOver);
            slot.addEventListener('drop', drop);
        });
        
        piecesContainer.addEventListener('dragover', dragOver);
        piecesContainer.addEventListener('drop', dropBack);
    }
    
    // Variables para el soporte táctil
    let touchDragging = false;
    let currentDragElement = null;
    let initialX, initialY;
    let currentDropTarget = null;
    
    // Manejar eventos táctiles
    function handleTouchStart(e) {
        e.preventDefault();
        touchDragging = true;
        currentDragElement = this;
        
        initialX = e.touches[0].clientX;
        initialY = e.touches[0].clientY;
        
        this.classList.add('dragging');
        
        // Crear un clon para mostrar mientras se arrastra
        const clone = this.cloneNode(true);
        clone.id = 'drag-clone';
        clone.style.position = 'fixed';
        clone.style.zIndex = '1000';
        clone.style.opacity = '0.8';
        clone.style.left = `${initialX - this.offsetWidth / 2}px`;
        clone.style.top = `${initialY - this.offsetHeight / 2}px`;
        clone.style.pointerEvents = 'none';
        document.body.appendChild(clone);
    }
    
    function handleTouchMove(e) {
        if (!touchDragging) return;
        e.preventDefault();
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        // Mover el clon
        const clone = document.getElementById('drag-clone');
        if (clone) {
            clone.style.left = `${touchX - clone.offsetWidth / 2}px`;
            clone.style.top = `${touchY - clone.offsetHeight / 2}px`;
        }
        
        // Detectar elemento debajo del dedo
        const elementsBelow = document.elementsFromPoint(touchX, touchY);
        const dropTarget = elementsBelow.find(el => 
            el.classList.contains('puzzle-piece-slot') || el.id === 'pieces-container');
        
        // Actualizar el objetivo actual
        if (dropTarget !== currentDropTarget) {
            currentDropTarget = dropTarget;
        }
    }
    
    function handleTouchEnd(e) {
        if (!touchDragging) return;
        
        // Eliminar el clon
        const clone = document.getElementById('drag-clone');
        if (clone) {
            document.body.removeChild(clone);
        }
        
        if (currentDropTarget) {
            // Simular un drop en el objetivo actual
            if (currentDropTarget.classList.contains('puzzle-piece-slot') && 
                !currentDropTarget.querySelector('.puzzle-piece')) {
                currentDropTarget.appendChild(currentDragElement);
                checkPuzzleCompletion();
            } else if (currentDropTarget.id === 'pieces-container' && 
                      currentDragElement.parentElement.classList.contains('puzzle-piece-slot')) {
                piecesContainer.appendChild(currentDragElement);
            }
        }
        
        currentDragElement.classList.remove('dragging');
        touchDragging = false;
        currentDragElement = null;
        currentDropTarget = null;
    }
    
    // Funciones para arrastrar y soltar (tradicional)
    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }
    
    function dragOver(e) {
        e.preventDefault();
    }
    
    function drop(e) {
        e.preventDefault();
        const pieceId = e.dataTransfer.getData('text/plain');
        const pieceElement = document.querySelector(`.puzzle-piece[data-id="${pieceId}"]`);
        
        // Si el slot ya tiene una pieza, no permitir soltar
        if (e.target.classList.contains('puzzle-piece-slot') && !e.target.querySelector('.puzzle-piece')) {
            e.target.appendChild(pieceElement);
            pieceElement.classList.remove('dragging');
            
            // Verificar si el rompecabezas está completo
            checkPuzzleCompletion();
        }
    }
    
    function dropBack(e) {
        e.preventDefault();
        const pieceId = e.dataTransfer.getData('text/plain');
        const pieceElement = document.querySelector(`.puzzle-piece[data-id="${pieceId}"]`);
        
        // Solo permitir soltar si viene de un slot
        if (pieceElement && pieceElement.parentElement && pieceElement.parentElement.classList.contains('puzzle-piece-slot')) {
            piecesContainer.appendChild(pieceElement);
            pieceElement.classList.remove('dragging');
        }
    }
    
    // Verificar si el rompecabezas está completo
    function checkPuzzleCompletion() {
        const slots = document.querySelectorAll('.puzzle-piece-slot');
        let isComplete = true;
        
        slots.forEach(slot => {
            const position = parseInt(slot.getAttribute('data-position'));
            const piece = slot.querySelector('.puzzle-piece');
            
            if (!piece || parseInt(piece.getAttribute('data-id')) !== position) {
                isComplete = false;
            }
        });
        
        if (isComplete) {
            // Mostrar mensaje de éxito
            successMessage.style.display = 'block';
            stopTimer();
        }
    }
    
    // Funciones para el temporizador
    function startTimer() {
        stopTimer(); // Para evitar múltiples intervalos
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }
    
    function updateTimer() {
        seconds++;
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }
        updateTimerDisplay();
    }
    
    function updateTimerDisplay() {
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        timerElement.textContent = `${formattedMinutes}:${formattedSeconds}`;
    }
    
    // Configurar la subida de imágenes
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                puzzleImage = e.target.result;
                alert('¡Imagen cargada con éxito! Haz clic en "Iniciar Juego" para usar tu imagen.');
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    // Manejar cambios de tamaño de ventana
    window.addEventListener('resize', function() {
        initPuzzleBoard();
        if (piecesContainer.children.length > 0) {
            // Hay un juego en progreso, recrear piezas con nuevos tamaños
            const { PIECE_SIZE, IMAGE_SIZE } = calculateSizes();
            
            // Actualizar tamaño de piezas existentes
            const pieces = document.querySelectorAll('.puzzle-piece');
            pieces.forEach(piece => {
                piece.style.width = `${PIECE_SIZE}px`;
                piece.style.height = `${PIECE_SIZE}px`;
                
                const imageContainer = piece.querySelector('.puzzle-image');
                imageContainer.style.backgroundSize = `${IMAGE_SIZE}px ${IMAGE_SIZE}px`;
                
                const pieceId = parseInt(piece.getAttribute('data-id'));
                const row = Math.floor(pieceId / PUZZLE_SIZE);
                const col = pieceId % PUZZLE_SIZE;
                imageContainer.style.backgroundPosition = `-${col * PIECE_SIZE}px -${row * PIECE_SIZE}px`;
            });
        }
    });
    
    // Prevenir zoom en dispositivos móviles al hacer doble toque
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Event listeners para los botones
    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
    
    // Agregar función para detectar elementos desde un punto
    if (!document.elementsFromPoint) {
        document.elementsFromPoint = function(x, y) {
            var elements = [];
            var element = document.elementFromPoint(x, y);
            
            while (element && element !== document.body) {
                elements.push(element);
                element.style.pointerEvents = 'none';
                element = document.elementFromPoint(x, y);
            }
            
            // Restaurar pointer-events
            elements.forEach(el => el.style.pointerEvents = '');
            
            return elements;
        };
    }
    
    // Inicializar el tablero al cargar la página
    initPuzzleBoard();
});