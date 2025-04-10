import { useState, useEffect } from 'react';

export const useTranslation = () => {
    const [translatedText, setTranslatedText] = useState('');
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            console.error('Speech Recognition is not supported in this browser');
            return;
        }

        const SpeechRecognition = window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            
            setTranslatedText(transcript);
        };

        recognitionInstance.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        setRecognition(recognitionInstance);

        return () => {
            if (recognitionInstance) {
                recognitionInstance.stop();
            }
        };
    }, []);

    const startTranslation = () => {
        if (recognition) {
            try {
                recognition.start();
                console.log('Speech recognition started');
            } catch (error) {
                console.error('Error starting speech recognition:', error);
            }
        }
    };

    const stopTranslation = () => {
        if (recognition) {
            try {
                recognition.stop();
                console.log('Speech recognition stopped');
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
    };

    return {
        translatedText,
        startTranslation,
        stopTranslation
    };
};