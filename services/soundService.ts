
import { AppConfig } from "../types";

export const playSound = (type: 'startup' | 'notification' | 'success', config?: AppConfig) => {
    const sounds = {
        // Gentle chime for entering the app
        startup: config?.startupSoundUrl || 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/potted_plant.mp3',
        // Distinct beep for status updates
        notification: 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.wav',
        // Cash register/Success sound for orders
        success: config?.checkoutSoundUrl || 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/arrow.mp3'
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
