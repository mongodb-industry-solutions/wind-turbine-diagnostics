"use client";

import { useState, useEffect } from "react";
import { Option, Select } from "@leafygreen-ui/select";
import styles from "./AudioDevicePicker.module.css";

const AudioDevicePicker = ({ deviceId, setDeviceId, recording }) => {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // Request permission to access audio devices
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        // Once permission is granted, enumerate devices
        navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
          const audioDevices = deviceInfos.filter(
            (device) => device.kind === "audioinput"
          );
          setDevices(audioDevices);
          if (audioDevices.length > 0) {
            setDeviceId(audioDevices[0].deviceId);
          }
        });
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });
  }, []);

  return (
    <>
      <div className={styles.deviceSection}>
        <p>Select Microphone: </p>
        <Select
          id="microphone-select"
          value={deviceId}
          aria-label="Microphone Select"
          placeholder=""
          disabled={recording}
          onChange={(value) => setDeviceId(value)}
        >
          {devices.map((device) => (
            <Option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId}`}
            </Option>
          ))}
        </Select>
      </div>
    </>
  );
};

export default AudioDevicePicker;
