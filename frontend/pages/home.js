import clientPromise from "../lib/mongodb";
import { useState } from "react";
import SampleRecorder from "../components/SampleRecorder/SampleRecorder";
import Stepper, { Step } from "@leafygreen-ui/stepper";
import styles from "../styles/home.module.css";
import AudioDevicePicker from "../components/AudioDevicePicker/AudioDevicePicker";
import Button from "@leafygreen-ui/button";
import DiagnosticsModule from "../components/DiagnosticsModule/DiagnosticsModule";
import InfoWizard from "../components/InfoWizard/InfoWizard";

export default function Home({ dictionary }) {
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [openHelpModal, setOpenHelpModal] = useState(false);

  const resetTraining = () => {
    setCurrentIndex(0);
  };

  return (
    <div className={styles.container}>
      <img id={styles.logo} height="30px" src="logo.png" alt="Logo Image" />
      <h1 id={styles.immutabletitle}>Wind Turbine Diagnostics Using AI</h1>

      <InfoWizard
        open={openHelpModal}
        setOpen={setOpenHelpModal}
        tooltipText="Tell me more!"
        iconGlyph="Wizard"
        sections={[
          {
            heading: "Instructions and Talk Track",
            content: [
              {
                heading: "Solution Overview",
                body: "The renewable energy sector is rapidly evolving with advancements in AI and machine learning, offering significant potential for efficiency gains and cost reductions, yet much innovation remains untapped. By integrating AI into renewable energy systems, new opportunities for efficiency gains and cost reductions emerge. Our solution explores the application of AI in real-time anomaly detection using sound input, highlighting the impact of MongoDB Atlas Vector Search.",
              },
              {
                heading: "How to Demo",
                body: [
                  "To run this demo you will need some way to produce different sounds (ie. a handheld fan) and a microphone to record them.",
                  "First, from the dropdown, select the microphone you want to use to record audio.",
                  "Next, we need to train our diagnostics module. In this case, training means recording audio samples for each of the categories we want to identify",
                  "Select the number of samples per stage, the more training samples, the more accurate the predictions will be but also the training will take longer. Between 2 and 3 samples is usually a good number of samples",
                  "Press “Start Recording”, all samples will be recorded automatically one after another. Each sample takes around 1 second to be recorded.",
                  "If training has been done previously, you can skip the whole training by pressing “Skip Training”.",
                  "After completing training for all engine statuses, press “Start diagnosis”.",
                  "If a new status is detected, a new gif will be displayed on the screen representing the new state and the state change will be added to the log list below."
                ],
              },
            ],
          },
          {
            heading: "Behind the Scenes",
            content: [
              {
                heading: "Data Flow",
                body: "",
              },
              {
                image: {
                  src: "./info.png",
                  alt: "Architecture",
                },
              },
            ],
          },
          {
            heading: "Why MongoDB?",
            content: [
              {
                heading: "Flexible Document Model",
                body: "MongoDB’s flexible document model allows storing AI-generated vector embeddings from audio recordings, alongside metadata, transcriptions etc. all in a single document.",
              },
              {
                heading: "Atlas Vector Search",
                body: "With MongoDB Atlas Vector Search, the system can efficiently search and compare vector embeddings to find similar audio patterns.",
              },
            ],
          },
        ]}
      />


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

export async function getServerSideProps({ }) {
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
