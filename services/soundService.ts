
export const playSound = (type: 'startup' | 'notification' | 'success') => {
    const sounds = {
        // Gentle chime for entering the app
        startup: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/potted_plant.mp3',
        // Distinct beep for status updates
        notification: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.wav',
        // Cash register/Success sound for orders
        success: 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/arrow.mp3'
    };

    try {
        const audio = new Audio(sounds[type]);
        audio.volume = 0.6;
        audio.play().catch(e => {
            // Autoplay policies might block this if no interaction has occurred yet
            console.log("Audio play suppressed:", e);
        });
    } catch (error) {
        console.error("Audio error:", error);
    }
};
