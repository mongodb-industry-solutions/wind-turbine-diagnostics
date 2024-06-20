import { useEffect, useState, useRef } from 'react';
import { startRecording, stopRecording } from '../../utils/audio';
import { useToast } from '@leafygreen-ui/toast';
import Button from "@leafygreen-ui/button";
import styles from "./DiagnosticsModule.module.css";
import io from 'socket.io-client';

const DiagnosticsModule = ({ dictionary, selectedDeviceId, recording, setRecording }) => {
    const defaultGif = 'https://media.tenor.com/dOAWtNUHo8sAAAAC/running-is-impossible-work-out.gif';

    const [messages, setMessages] = useState([]);
    const [currentGif, setCurrentGif] = useState(defaultGif);
    const previousAudioRef = useRef('');
    const { pushToast } = useToast();

    useEffect(() => {
        const socket = io();

        socket.on('message', (message) => {
            const currentAudio = message.audio;
            console.log(`Current audio: ${message.audio}`);
            console.log(`Previous audio: ${previousAudioRef.current}`)
            if (currentAudio !== previousAudioRef.current) {
                const date = new Date();
                const hours = ('0' + date.getHours()).slice(-2);
                const minutes = ('0' + date.getMinutes()).slice(-2);
                const seconds = ('0' + date.getSeconds()).slice(-2);
                const timestamp = `${hours}:${minutes}:${seconds}`;

                setMessages(prevMessages => [
                    { timestamp, audio: currentAudio },
                    ...prevMessages
                ]);
                previousAudioRef.current = currentAudio;

                const matchingAudio = dictionary.find(item => item.audio === currentAudio);
                if (matchingAudio && matchingAudio.image) {
                    setCurrentGif(matchingAudio.image);
                } else {
                    setCurrentGif(defaultGif);
                }
            }
        });

        return () => {
            socket.off('message');
        };
    }, []);


    const handleStartDiagnostics = async () => {
        previousAudioRef.current = '';
        setMessages([]);
        try {
            await startRecording(selectedDeviceId, null, setRecording, 100);
        } catch (error) {
            console.error('Error starting diagnostics:', error);
            pushToast({title: "Failed to start diagnostics. Please, try again.", variant: "warning"});
        }
    };

    const handleStopDiagnostics = () => {
            stopRecording();
            setCurrentGif(defaultGif);
    };

    return (
        <>
            <h1 className={styles.title2}>Match to reference</h1>
            <div>
                <Button 
                    disabled={recording} 
                    onClick={handleStartDiagnostics}
                    variant="primaryOutline"    
                >
                    Start Diagnostics
                </Button>
                <Button 
                    disabled={!recording} 
                    onClick={handleStopDiagnostics}
                    variant="dangerOutline"  
                    className={styles.stopBtn}  
                >
                    Stop Diagnostics
                </Button>
            </div>
            <img id={styles.funnyGIF} src={currentGif} height="500px" />
            <div id="log-list">
                <h2 className={styles.log}>Log</h2>
                <ul className={styles.messages}>
                    {messages.map((msg, index) => (
                        <li key={index}>{msg.timestamp} - {msg.audio}</li>
                    ))}
                </ul>
            </div>
        </>
    );
  };
  
  export default DiagnosticsModule;