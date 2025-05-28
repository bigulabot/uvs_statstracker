class CardCounter {
    constructor(cardElement) {
        this.card = cardElement;
        this.type = cardElement.querySelector('p').textContent.toLowerCase();
        this.incrementDisplay = cardElement.querySelector('.increment-display');
        this.counter = cardElement.querySelector('h1');
        this.holdInterval = null;
        this.holdStartTime = null;
        this.isTouch = false;
        this.baseValue = null;
        this.incrementTimeout = null;

        this.init();
    }

    init() {
        this.createInteractionAreas();
    }

    getValue() {
        return parseInt(this.counter.textContent) || 0;
    }

    setValue(value) {
        this.counter.textContent = value;
    }

    increment() {
        this.setValue(this.getValue() + 1);
        this.updateIncrementDisplay();
    }

    decrement() {
        const currentValue = this.getValue();
        if (this.type === 'speed' || this.type === 'damage') {
            this.setValue(currentValue - 1);
        } else {
            this.setValue(Math.max(0, currentValue - 1));
        }
        this.updateIncrementDisplay();
    }

    getAcceleratedInterval() {
        if (!this.holdStartTime) return 200;

        const holdDuration = Date.now() - this.holdStartTime;

        // Acceleration tiers
        if (holdDuration < 1000 / 2) return 200;      // 0-1s: 200ms interval
        if (holdDuration < 2000 / 2) return 150;      // 1-2s: 150ms interval
        if (holdDuration < 3000 / 2) return 100;      // 2-3s: 100ms interval
        if (holdDuration < 5000 / 2) return 50;       // 3-5s: 50ms interval
        return 25;                                // 5s+: 25ms interval (very fast)
    }

    startHold(action) {
        if (this.baseValue == null)
            this.baseValue = this.getValue(); // Store the starting value

        this.holdStartTime = Date.now();
        action(); // Execute immediately

        const accelerateHold = () => {
            action();
            const interval = this.getAcceleratedInterval();
            this.holdInterval = setTimeout(accelerateHold, interval);
        };

        this.holdInterval = setTimeout(accelerateHold, this.getAcceleratedInterval());

        this.updateIncrementDisplay();
    }

    stopHold(element) {
        if (this.holdInterval) {
            clearTimeout(this.holdInterval);
            this.holdInterval = null;
        }
        this.holdStartTime = null;
        // element.classList.remove('pressed');
        this.startIncrementTimeout();
    }

    setupHold(element, action) {
        // Touch events
        element.addEventListener('touchstart', (e) => {
            this.isTouch = true;
            element.classList.add('active');
            this.startHold(action);
            e.preventDefault();
        });

        // Mouse events (only if not touch)
        element.addEventListener('mousedown', (e) => {
            if (this.isTouch) return;
            element.classList.add('active');
            this.startHold(action);
        });

        // Stop events
        ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(evt => {
            element.addEventListener(evt, () => {
                element.classList.remove('active');
                this.stopHold(element);
                // Reset touch flag after a delay to allow for proper event handling
                if (evt.startsWith('touch')) {
                    setTimeout(() => { this.isTouch = false; }, 100);
                }
            });
        });
    }

    updateIncrementDisplay() {
        clearTimeout(this.incrementTimeout);
        if (this.baseValue === null) return;

        const currentValue = this.getValue();
        const increment = currentValue - this.baseValue;

        this.incrementDisplay.textContent = increment > 0 ? `+${increment}` : `${increment}`;
        this.incrementDisplay.style.opacity = '1';
    }

    startIncrementTimeout() {
        // Start the timeout to hide the increment display
        clearTimeout(this.incrementTimeout);
        this.incrementTimeout = setTimeout(() => {
            this.hideIncrementDisplay();
        }, 1000); // Hide after 1 seconds of inactivity
    }

    hideIncrementDisplay() {
        this.incrementDisplay.style.opacity = '0';
        this.baseValue = null;
    }

    createInteractionAreas() {
        const topHalf = this.createHalfElement('top-half', { top: 0 });
        const bottomHalf = this.createHalfElement('bottom-half', { bottom: 0 });

        this.setupHold(topHalf, () => this.increment());
        this.setupHold(bottomHalf, () => this.decrement());

        this.card.appendChild(topHalf);
        this.card.appendChild(bottomHalf);
    }

    createHalfElement(className, position) {
        const element = document.createElement('div');
        element.className = `half ${className}`;

        Object.assign(element.style, {
            position: 'absolute',
            left: '0',
            width: '100%',
            height: '50%',
            cursor: 'pointer',
            ...position
        });

        return element;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => new CardCounter(card));

    const positionButtons = document.querySelectorAll('.center-controls button');
    positionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            positionButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    let timeout;

    const resetButton = document.querySelector('.round-button');

    const reset = (e) => {
        e.preventDefault();
        clearTimeout(timeout);

        const cards = document.querySelectorAll('.card');
        timeout = setTimeout(() => {
            if (cards.length >= 4) {
                const thirdCounter = cards[2].querySelector('h1');
                const fourthCounter = cards[3].querySelector('h1');
                if (thirdCounter) thirdCounter.textContent = '25';
                if (fourthCounter) fourthCounter.textContent = '25';
            }
        }, 1500);

        const firstCounter = cards[0].querySelector('h1');
        const secondCounter = cards[1].querySelector('h1');
        if (firstCounter) firstCounter.textContent = '0';
        if (secondCounter) secondCounter.textContent = '0';
        positionButtons.forEach(b => b.classList.remove('active'));
        resetButton.classList.add('active');
    };

    const resetClear = (e) => {
        clearTimeout(timeout);
        resetButton.classList.remove('active');
    };


    resetButton.addEventListener('touchstart', (e) => {
        console.log('touchstart');
        reset(e);
    }, { passive: false });
    resetButton.addEventListener('mousedown', (e) => {
        console.log('mousedown');
        reset(e);
    });

    resetButton.addEventListener('mouseup', resetClear);
    resetButton.addEventListener('touchend', resetClear);

    // Prevent long press, double-tap zoom, and magnify on iOS
    document.body.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault(); // Prevent multi-touch zoom
        }
    }, { passive: false });

    document.body.addEventListener('gesturestart', (e) => {
        e.preventDefault(); // Prevent pinch-to-zoom
    });

    document.body.addEventListener('dblclick', (e) => {
        e.preventDefault(); // Prevent double-tap zoom
    });

    // Request fullscreen when the page loads
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) { // Safari
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
        document.documentElement.msRequestFullscreen();
    }
});