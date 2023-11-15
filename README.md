# mongodb-wind-turbine
A tongue in cheek demonstration of using mongodb's vector search to determine issues with wind turbines

Create a file called .env in the main directory alongside the add_audio.py file and add your atlas connection string.  Then copy this file in to the nodeUI directory too.

MONGO_CONNECTION_STRING="mongodb+srv://connectionstringfromatlas"

Install the required python modules:

pip install pyaudio

pip install numpy

pip install pymongo

pip install librosa

pip install panns_inference

pip install torch

pip install python-dotenv

run 'python add_audio.py'

Select the audio input by typing the relevant number (I use an external microphone placed very close to the fan) and then press enter

Record each sound in sequence

Go to Atlas and create an atlas search index in the 'audio' database 'sounds' collection and the using the content of searchindex.json

  {
    "mappings": {
      "dynamic": true,
      "fields": {
        "emb": {
          "dimensions": 2048,
          "similarity": "cosine",
          "type": "knnVector"
        }
      }
    }
  }

run 'python live_query.py'

Switch to a new console and cd to the 'nodeUI' directory.

run 'npm install'

run 'node nodeui.js'

Use a browser to open the link http://localhost:3000/

Go to charts in Atlas, and click the down arrow next to 'Add Dashboard' then click 'import dashboard'

Select the file 'Sounds.charts'

Click 'next'

Click on the pencil icon and ensure the database and collection match 'audio' and 'results'

Click 'Save', and the 'Save'

Click the new dashboard 'Sounds' to see analytics on the sounds that are being detected by the microphone.
