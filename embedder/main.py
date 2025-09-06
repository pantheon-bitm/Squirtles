from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List
import uvicorn
import os
<<<<<<< HEAD

import requests
import uuid

# Initialize FastAPI app
app = FastAPI(title="Text Embedding Service - Gemini Alternative", version="1.0.0")

NODE_QUEUE_URL = "http://localhost:3000/api/queue"


=======
# Initialize FastAPI app
app = FastAPI(title="Text Embedding Service - Gemini Alternative", version="1.0.0")

>>>>>>> fafb721 (fresh frontend)
# Load the high-quality e5-large-v2 model for better semantic similarity
try:
    # Using e5-large-v2 which is excellent for semantic similarity
    model = SentenceTransformer('intfloat/e5-large-v2')  # 1024 dimensions
    print("e5-large-v2 model loaded successfully")
    print(f"Model max sequence length: {model.max_seq_length}")
    print(f"Output dimension: {model.get_sentence_embedding_dimension()}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Request model
class TextRequest(BaseModel):
    text: str

# Response model
class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dimension: int

def preprocess_text_for_e5(text: str, task_type: str = "query") -> str:
    """
    Preprocess text for e5 models according to their training protocol.
    e5 models were trained with specific prefixes for optimal performance.
    """
    text = text.strip()
    if not text:
        return text
    
    # e5 models perform better with task-specific prefixes
    if task_type == "query":
        return f"query: {text}"
    elif task_type == "passage":
        return f"passage: {text}"
    else:
        return text
<<<<<<< HEAD
    
def send_to_node_queue(embedding: List[float], text: str, source: str = "fastapi-service"):
    """
    Forward embeddings + metadata to Node.js queue API.
    """
    metadata = {
        "id": str(uuid.uuid4()),   # unique ID for the chunk
        "chunk": text,
        "source": source
    }

    payload = {
        "embeddings": embedding,
        "metadata": metadata
    }

    try:
        res = requests.post(NODE_QUEUE_URL, json=payload)
        res.raise_for_status()
        print(f" Sent chunk {metadata['id']} to Node.js queue")
    except Exception as e:
        print(f" Failed to send to Node.js queue: {e}")




=======
>>>>>>> fafb721 (fresh frontend)

@app.post("/", response_model=EmbeddingResponse)
async def embed_text(request: TextRequest):
    """
    Embed input text using e5-large-v2 optimized for semantic similarity.
    Automatically detects if input is a search query or document passage.
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        text = request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Preprocess text for e5 model (treat as query by default)
        processed_text = preprocess_text_for_e5(text, "query")
        
        # Get embedding with proper normalization
        embedding = model.encode(
            processed_text, 
            convert_to_numpy=True, 
            normalize_embeddings=True,
            show_progress_bar=False
        )
<<<<<<< HEAD
=======
        
       
        
>>>>>>> fafb721 (fresh frontend)
        return EmbeddingResponse(
            embedding=embedding.tolist(),
            dimension=len(embedding)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing text: {str(e)}")

@app.post("/passage", response_model=EmbeddingResponse)
async def embed_passage(request: TextRequest):
    """
    Embed text as a passage/document (for indexing).
    Use this for embedding image descriptions, titles, etc.
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        text = request.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Preprocess text as passage for better indexing
        processed_text = preprocess_text_for_e5(text, "passage")
        
        embedding = model.encode(
            processed_text, 
            convert_to_numpy=True, 
            normalize_embeddings=True,
            show_progress_bar=False
        )
        
       
        
        return EmbeddingResponse(
            embedding=embedding.tolist(),
            dimension=len(embedding)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing passage: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model_loaded": model is not None}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Text Embedding Service - Gemini Alternative",
        "description": "High-quality semantic embeddings optimized for similarity tasks",
        "usage": {
            "single": "POST to / with JSON body containing 'text' field",
            "batch": "POST to /batch with array of text strings"
        },
        "output_dimension": 1024,
        "model": "Semantic similarity optimized",
        "features": ["normalized_embeddings", "batch_processing", "semantic_similarity"]
    }

<<<<<<< HEAD



@app.post("/index")
async def embed_and_index(request: TextRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    processed_text = preprocess_text_for_e5(text, "passage")
    embedding = model.encode(
        processed_text,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False
    )
    embedding_list = embedding.tolist()

    # Sending to Node.js queue
    send_to_node_queue(embedding_list, text)

    return {"success": True, "dimension": len(embedding_list)}


=======
>>>>>>> fafb721 (fresh frontend)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)