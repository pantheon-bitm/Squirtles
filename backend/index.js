import { connectDB } from "./db/connectDB.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import OpenAI from "openai";

const app = express();
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true,
    methods:['GET','POST','PUT','DELETE'],
    allowedHeaders:['Content-Type','Authorization','Accept','X-Requested-With','X-CSRF-Token'],
}
));
app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true,limit:'16kb'}));
app.use(cookieParser());
connectDB();

// Configuration for local services
const EMBEDDER_URL = process.env.EMBEDDER_URL || "http://localhost:8000";
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION_NAME = "vector-search";

// Initialize OpenAI client
// let openai = null;
// if (process.env.OPENAI_API_KEY) {
// openai = new OpenAI({
//     apiKey: "AIzaSyBNLC3IPDdSXgLGfsfIRe7XsUVZyji45pQ",
//     baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
// });
//   console.log("✅ OpenAI client initialized successfully");
// } else {
//   console.warn("⚠️  OPENAI_API_KEY not found in environment variables. Chat responses will use fallback mode.");
// }
const openai = new OpenAI({
    apiKey: "AIzaSyBNLC3IPDdSXgLGfsfIRe7XsUVZyji45pQ",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});
//routes import
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users",userRouter)

// Helper function to generate embeddings using local embedder service
const generateQueryEmbedding = async (text) => {
  try {
    const response = await fetch(`${EMBEDDER_URL}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: text })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.embedding) {
      return data.embedding;
    } else {
      throw new Error("Invalid embedding response");
    }
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    throw error;
  }
};

// Helper function to search Qdrant vector database
const searchVectorDB = async (queryEmbedding, limit = 5) => {
  try {
    const searchPayload = {
      vector: queryEmbedding,
      limit: limit,
      with_payload: true,
      with_vector: false
    };

    const response = await fetch(
      `${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error("Error searching vector database:", error.message);
    throw error;
  }
};

// Helper function to generate AI response using OpenAI SDK
const generateAIResponse = async (context, userQuery) => {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }

    // Prepare context from search results
    const contextText = context
      .map((item, index) => {
        const source = item.payload?.source || 'unknown';
        const title = item.payload?.title || 'No title';
        const content = item.payload?.content || '';
        const from = item.payload?.from ? ` (from: ${item.payload.from})` : '';
        const date = item.payload?.date || item.payload?.lastUpdated || '';
        
        return `[Document ${index + 1}] Source: ${source}${from}
Title: ${title}
Date: ${date}
Content: ${content}
---`;
      })
      .join('\n\n');

    const systemPrompt = `You are a helpful AI assistant that answers user queries based on the available context from Gmail emails, Google Drive files, and Calendar events.

Available Context:
${contextText}

Instructions:
- Answer the user's question based only on the provided context
- If the context doesn't contain relevant information, say so clearly
- Cite which source(s) you're referencing in your answer
- Be concise but informative
- If referencing emails, mention the sender when relevant
- If referencing files, mention the file type when relevant
- If referencing calendar events, mention dates/times when relevant`;

    const completion = await openai.chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    if (completion.choices && completion.choices[0] && completion.choices[0].message) {
      return completion.choices[0].message.content;
    } else {
      throw new Error('Invalid response from OpenAI API');
    }

  } catch (error) {
    console.error("Error generating AI response:", error.message);
    
    // Fallback response if OpenAI fails
    const contextText = context.map(item => 
      `Source: ${item.payload?.source || 'unknown'}\nTitle: ${item.payload?.title || 'No title'}\nContent: ${item.payload?.content || ''}`
    ).join('\n\n');

    return `I found ${context.length} relevant document(s) for your query "${userQuery}":

${contextText}

Note: AI response generation is currently unavailable. The above information is directly from your documents.`;
  }
};

// Chat endpoint with local embeddings and vector search
app.get('/chat', async (req, res) => {
  try {
    const userQuery = req.query.message;
    
    if (!userQuery) {
      return res.status(400).json({
        error: "Message parameter is required"
      });
    }

    console.log(`Processing chat query: ${userQuery}`);

    // Step 1: Generate embedding for user query using local embedder
    console.log("Generating query embedding...");
    const queryEmbedding = await generateQueryEmbedding(userQuery);

    // Step 2: Search vector database for relevant documents
    console.log("Searching vector database...");
    const searchResults = await searchVectorDB(queryEmbedding, 5);

    if (searchResults.length === 0) {
      return res.json({
        message: "I couldn't find any relevant information for your query. Please try rephrasing your question.",
        docs: [],
        query: userQuery
      });
    }

    // Step 3: Generate AI response based on context
    console.log(`Found ${searchResults.length} relevant documents. Generating response...`);
    const aiResponse = await generateAIResponse(searchResults, userQuery);

    // Step 4: Return response with context
    return res.json({
      message: aiResponse,
      docs: searchResults.map(result => ({
        id: result.id,
        score: result.score,
        source: result.payload?.source,
        title: result.payload?.title,
        content: result.payload?.content?.substring(0, 500) + "...", // Truncate for response
        metadata: {
          from: result.payload?.from,
          date: result.payload?.date || result.payload?.lastUpdated,
          chunkIndex: result.payload?.chunkIndex
        }
      })),
      query: userQuery,
      totalResults: searchResults.length
    });

  } catch (error) {
    console.error("Chat endpoint error:", error.message);
    return res.status(500).json({
      error: "An error occurred while processing your request",
      message: error.message,
      query: req.query.message,
      suggestion: error.message.includes('OpenAI') ? 
        "Please check your OPENAI_API_KEY environment variable" : 
        "Please ensure embedder and vector database services are running"
    });
  }
});

// Test endpoint for OpenAI integration
app.get('/test/openai', async (req, res) => {
  try {
    if (!openai) {
      return res.status(400).json({
        error: "OpenAI client not initialized",
        message: "Please set the OPENAI_API_KEY environment variable and restart the server"
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "OpenAI SDK integration is working!" if you can read this.' }
      ],
      max_tokens: 50
    });
    
    res.json({
      success: true,
      message: "OpenAI SDK integration is working!",
      response: completion.choices[0]?.message?.content || "No response",
      usage: completion.usage,
      model: completion.model
    });

  } catch (error) {
    console.error("OpenAI test error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      suggestion: "Check your OPENAI_API_KEY and internet connection"
    });
  }
});

// Health check for embedder service
app.get('/health/embedder', async (req, res) => {
  try {
    const response = await fetch(`${EMBEDDER_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    res.json({ embedder: "healthy", details: data });
  } catch (error) {
    res.status(503).json({ embedder: "unhealthy", error: error.message });
  }
});

// Health check for vector database
app.get('/health/vectordb', async (req, res) => {
  try {
    const response = await fetch(`${QDRANT_URL}/collections`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    res.json({ vectordb: "healthy", collections: data });
  } catch (error) {
    res.status(503).json({ vectordb: "unhealthy", error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
})