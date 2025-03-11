"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { startRecording, stopRecording } from "../../lib/audio";
import { toast } from "react-hot-toast";
import Button from "@leafygreen-ui/button";
import styles from "./DiagnosticsModule.module.css";
import { v4 as uuidv4 } from "uuid";

const DiagnosticsModule = ({
  dictionary,
  selectedDeviceId,
  recording,
  setRecording,
}) => {
  const defaultGif =
    "https://media.tenor.com/dOAWtNUHo8sAAAAC/running-is-impossible-work-out.gif";

  const [messages, setMessages] = useState([]);
  const [currentGif, setCurrentGif] = useState(defaultGif);
  const previousAudioRef = useRef("");
  const sseConnection = useRef(null);
  const sessionId = useRef(uuidv4());

  const listenToSSEUpdates = useCallback(() => {
    const collection = "results";
    console.log("Listening to SSE updates...");
    const eventSource = new EventSource(
      "/api/sse?sessionId=" + sessionId.current + "&colName=" + collection
    );

    eventSource.onopen = () => {
      console.log("SSE connection opened.");
    };

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const currentAudio = message.fullDocument?.results[0]?.audio;
      console.log(`Current audio: ${currentAudio}`);
      console.log(`Previous audio: ${previousAudioRef.current}`);

      if (currentAudio !== previousAudioRef.current) {
        const date = new Date();
        const hours = ("0" + date.getHours()).slice(-2);
        const minutes = ("0" + date.getMinutes()).slice(-2);
        const seconds = ("0" + date.getSeconds()).slice(-2);
        const timestamp = `${hours}:${minutes}:${seconds}`;

        setMessages((prevMessages) => [
          { timestamp, audio: currentAudio },
          ...prevMessages,
        ]);
        previousAudioRef.current = currentAudio;

        const matchingAudio = dictionary.find(
          (item) => item.audio === currentAudio
        );
        setCurrentGif(matchingAudio?.image || defaultGif);
      }
    };

    eventSource.onerror = (event) => {
      console.error("SSE Error:", event);
    };

    // Close previous SSE connection if it exists
    if (sseConnection.current) {
      sseConnection.current.close();
      console.log("Previous SSE connection closed.");
    }

    sseConnection.current = eventSource;
    return eventSource;
  }, [dictionary]);

  useEffect(() => {
    const eventSource = listenToSSEUpdates();
    return () => {
      if (eventSource) {
        eventSource.close();
        console.log("SSE connection closed.");
      }
    };
  }, [listenToSSEUpdates]);

  const handleStartDiagnostics = async () => {
    previousAudioRef.current = "";
    setMessages([]);
    try {
      await startRecording(selectedDeviceId, null, setRecording, 100);
    } catch (error) {
      console.error("Error starting diagnostics:", error);
      toast.error("Failed to start diagnostics. Please, try again.", {
        position: "bottom-left",
      });
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
            <li key={index}>
              {msg.timestamp} - {msg.audio}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default DiagnosticsModule;
