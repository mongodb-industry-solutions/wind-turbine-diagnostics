from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import librosa
from panns_inference import AudioTagging
import io
from pydub import AudioSegment
from pymongo import MongoClient
import os
import certifi
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = FastAPI()

connection_string = os.getenv('MONGO_CONNECTION_STRING')

# Initialize the AudioTagging model
model = AudioTagging(checkpoint_path=None, device='cuda')

# Deine MongoDB client
client = MongoClient(connection_string, tlsCAFile=certifi.where())
db = client['audio']
mongodb_sounds_collection = db['sounds']
mongodb_results_collection = db['results']

# Function to normalize a vector
def normalize(v):
    norm = np.linalg.norm(v)
    if norm == 0:
        return v
    return v / norm

# Function to get an embedding of an audio file
def get_embedding(audio_data):
    #input_array = np.array(audio_data, dtype=np.int16)
    #scaled_array = np.interp(audio_data, (float32_min, float32_max), (-1, 1))
    query_audio = audio_data[None, :]
    _, emb = model.inference(query_audio)
    normalized_v = normalize(emb[0])
    return normalized_v

def insert_mongo_sounds(audio_name,embedding,audio_file,image, mongodb_sounds_collection):
    # Create the results document
    entry = {"audio":audio_name,"emb":embedding,"audio_file":audio_file,"image":image}

    try:
        # Insert the document into the MongoDB collection
        mongodb_sounds_collection.insert_one(entry)
    except Exception as e:
        print(f"Error inserting document: {e}")
        return False
    return True

def insert_mongo_results(results, mongodb_results_collection):
    # Create the results document
    entry = {"sensor":"Ralph's laptop","data_time":datetime.now(),"results":results}
    try:
        mongodb_results_collection.insert_one(entry)
    except Exception as e:
        print(f"Error inserting document: {e}")
        return False
    return True

def knnbeta_search(embedding, mongodb_sounds_collection):
    # Create the query vector
    query_vector = embedding.tolist()

    # Create the search query
    search_query = [
        {
            "$search": {
                "knnBeta": {
                    "vector": query_vector,
                    "path": "emb",
                    "k": 3
                }
            }
        },
        {
            "$project": {
            "_id": 0,
            "audio": 1,
            #"image": 1,
            "audio_file": 1,
            "score": { "$meta": "searchScore" }
            }
        }
    ]

    # Perform the search query
    results = mongodb_sounds_collection.aggregate(search_query)

    return results

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow requests from this origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/embed-audio")
async def embed_audio(file: UploadFile = File(...), audio_name: str = None):
    if file.content_type != "audio/webm":
        return JSONResponse(status_code=400, content={"message": "Invalid file type. Please upload a WebM file."})

    audio_bytes = io.BytesIO(await file.read())
    audio_segment = AudioSegment.from_file(audio_bytes, format="webm")
    
    wav_bytes = io.BytesIO()
    audio_segment.export(wav_bytes, format="wav")
    wav_bytes.seek(0)

    # Save converted file to verify
    #timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    #with open(f"recording_{timestamp}.wav", "wb") as f:
    #    f.write(wav_bytes.read())
    #wav_bytes.seek(0)
    
    audio_data, _ = librosa.load(wav_bytes, sr=44100, dtype=np.float32)
    emb = get_embedding(audio_data)
    if audio_name is None:
        results = knnbeta_search(emb, mongodb_sounds_collection)
        json_results = list(results)
        insert_mongo_results(json_results,mongodb_results_collection)
    else: 
        insert_mongo_sounds(audio_name, emb.tolist(),"0","",mongodb_sounds_collection)
    
    return {"success": True}

# To run the FastAPI server, use the command: uvicorn main:app --reload
