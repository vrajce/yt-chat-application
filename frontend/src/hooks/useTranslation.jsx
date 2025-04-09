import { useState, useEffect } from 'react';

const API_KEY = 'AIzaSyCLH7Pg7xug6D1N4Fa4Qq5kMfD3pXq_zzk';

export const useTranslation = () => {
    const [translatedText, setTranslatedText] = useState('');
    const [recognition, setRecognition] = useState(null);

    const startTranslation = () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onresult = async (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                
                try {
                    const response = await fetch(
                        `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                q: transcript,
                                target: 'en', // Change this based on user preference
                                source: 'auto',
                            }),
                        }
                    );

                    const data = await response.json();
                    if (data.data.translations[0].translatedText) {
                        setTranslatedText(data.data.translations[0].translatedText);
                    }
                } catch (error) {
                    console.error('Translation error:', error);
                }
            };

            recognition.start();
            setRecognition(recognition);
        }
    };

    const stopTranslation = () => {
        if (recognition) {
            recognition.stop();
            setRecognition(null);
        }
    };

    return {
        startTranslation,
        stopTranslation,
        translatedText,
    };
};