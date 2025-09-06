import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());


const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "vector-search";
const COLLECTION = "embeddings";   //
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // put in .env
const VECTOR_DB = "http://localhost:6333"; // Qdrant default, adjust if 

let mongoClient;

//connect mongo 

async function connectMongo(){
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    console.log("Connected to MongoDB");
}

//search in vector db

async function searchEmbeddings(query,topK = 3) {
    //generate embedding for the query
    const embedRes = await fetch("http://127.0.0.1:7860/passage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passage: query })
    });

    if(!embedRes.ok) throw new Error("Not able to generate query embedding");

    const {embedding } = await embedRes.json();

    //search in vector db 

    const searchRes = await fetch(`${VECTOR_DB}/collections/${DB_NAME}/points/search`,{
          method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vector: embedding,
      limit: topK
    })
    });

    const data = await searchRes.json();
    return data.result.map( r => r.payload.text); /// CRITICAL PART
}

//gemini call 

async function askGemini(question,context) {
    const systemPrompt = `
    You are a helpful assistant.
Use ONLY the provided context to answer the question.
If the context does not contain the answer, reply: "Sorry, I don’t know that."
Context:
${context.join("\n\n")}
  `;
  const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\nQ: " + question }] }
        ]
      })
    }
  );


  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from model.";
}


// chatbot endpoint 

app.post("/chat", async(req,res) => {
    try{
        const { question } = req.body;
        if(!question) return res.status(400).json({ error: "Question required "});
        //

        if(question.toLowerCase().includes("password") || question.toLowerCase().includes("hack")) {
            return res.json({ answer: " This request is not allowed." });
        }

        const contextDocs = await searchEmbeddings(question);

        const answer = await askGemini(question, contextDocs);

        res.json({ answer });
    } catch (err) {
        console.log("Error");
        res.status(500).json({ error : "Something went wrong. "});
    }
});

app.listen(4000, async () => {
    await connectMongo();
    console.log(`Chatbot running on http://localhost:4000`);
});



