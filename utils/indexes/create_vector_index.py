import os
import logging

from pymongo import MongoClient
from pymongo.errors import OperationFailure
import certifi
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

MONGODB_URI = os.getenv("MONGODB_URI")
APP_NAME = os.getenv("APP_NAME", "devrel-demo-vectorsearch-audio-turbine")
VECTOR_INDEX_NAME = os.getenv("VECTOR_INDEX_NAME", "vector_index")


def create_vector_index(
    collection,
    index_name: str = VECTOR_INDEX_NAME,
    vector_field: str = "emb",
    dimensions: int = 2048,
    similarity_metric: str = "cosine",
) -> dict:
    """ Creates an Atlas Vector Search index on the given collection, matching
    utils/indexes/search_index.json. """
    index_config = {
        "name": index_name,
        "type": "vectorSearch",
        "definition": {
            "fields": [
                {
                    "path": vector_field,
                    "type": "vector",
                    "numDimensions": dimensions,
                    "similarity": similarity_metric,
                }
            ]
        },
    }

    try:
        collection.create_search_index(index_config)
        logger.info(f"Vector search index '{index_name}' created successfully.")
        return {"status": "success", "message": f"Vector search index '{index_name}' created successfully."}
    except OperationFailure as e:
        if e.code == 68:  # IndexAlreadyExists
            logger.info(f"Vector search index '{index_name}' already exists.")
            return {"status": "info", "message": f"Vector search index '{index_name}' already exists."}
        logger.error(f"Error creating vector search index: {e}")
        return {"status": "error", "message": f"Error creating vector search index: {e}"}


if __name__ == "__main__":
    client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where(), appname=APP_NAME)
    collection = client["audio"]["sounds"]
    result = create_vector_index(collection)
    print(result)
