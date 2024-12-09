import clientPromise from "../lib/mongodb";
import { useState } from "react";
import SampleRecorder from "../components/SampleRecorder/SampleRecorder";
import Stepper, { Step } from "@leafygreen-ui/stepper";
import styles from "../styles/home.module.css";
import AudioDevicePicker from "../components/AudioDevicePicker/AudioDevicePicker";
import Button from "@leafygreen-ui/button";
import DiagnosticsModule from "../components/DiagnosticsModule/DiagnosticsModule";

export default function Home({ dictionary }) {
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recording, setRecording] = useState(false);

  const resetTraining = () => {
    setCurrentIndex(0);
  };

  return (
    <div className={styles.container}>
      <img id={styles.logo} height="30px" src="logo.png" alt="Logo Image" />
      <h1 id={styles.immutabletitle}>Wind Turbine Diagnostics Using AI</h1>

      <AudioDevicePicker
        deviceId={selectedDeviceId}
        setDeviceId={setSelectedDeviceId}
        recording={recording}
      />

      <Button
        className={styles.resetBtn}
        disabled={recording}
        onClick={resetTraining}
      >
        Reset
      </Button>

      {currentIndex < dictionary.length ? (
        <SampleRecorder
          dictionary={dictionary}
          selectedDeviceId={selectedDeviceId}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          recording={recording}
          setRecording={setRecording}
        />
      ) : (
        <DiagnosticsModule
          dictionary={dictionary}
          selectedDeviceId={selectedDeviceId}
          recording={recording}
          setRecording={setRecording}
        />
      )}

      <Stepper
        currentStep={currentIndex}
        className={styles.stepper}
        maxDisplayedSteps={5}
      >
        {dictionary.map((item, index) => (
          <Step key={index}>{item.audio}</Step>
        ))}
      </Stepper>
    </div>
  );
}

export async function getServerSideProps({}) {
  try {
    const client = await clientPromise;
    const db = client.db("audio");

    const dictionary = await db
      .collection("dictionary")
      .find({})
      .sort({ rank: 1 })
      .toArray();

    return {
      props: { dictionary: JSON.parse(JSON.stringify(dictionary)) },
    };
  } catch (error) {
    console.log(error);
    return {
      props: { dictionary: [] },
    };
  }
}
