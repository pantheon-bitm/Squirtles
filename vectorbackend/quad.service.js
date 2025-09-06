import { quad, COLLECTION_NAME, VECTOR_SIZE } from "./connectVectorDB.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

/**
 * Qdrant Service for RAG (Retrieval-Augmented Generation)
 * Handles vector storage and retrieval for email, calendar, and drive data
 */

const EMBEDDER_URL = process.env.EMBEDDER_URL || "http://localhost:8000";

/**
 * Generate embeddings using the embedder service
 * @param {string} text - Text to embed
 * @param {string} type - Type of embedding ("query" or "passage")
 * @returns {Array} Embedding vector
 */
const generateEmbedding = async (text, type = "passage") => {
  try {
    const endpoint = type === "query" ? "/" : "/passage";
    const response = await axios.post(`${EMBEDDER_URL}${endpoint}`, {
      text: text
    });
    
    if (response.data && response.data.embedding) {
      return response.data.embedding;
    } else {
      throw new Error("Invalid embedding response");
    }
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    throw error;
  }
};

/**
 * Upload document chunk to Qdrant vector database
 * @param {Object} metadata - Document metadata from the queue
 */
export const uploadToVectorDB = async (metadata) => {
  try {
    // Validate required fields
    if (!metadata.content && !metadata.title) {
      throw new Error("Document must have content or title");
    }

    // Prepare text for embedding (combine title and content for better context)
    const textToEmbed = [
      metadata.title || "",
      metadata.content || ""
    ].filter(Boolean).join(" ").trim();

    if (!textToEmbed) {
      throw new Error("No meaningful text found for embedding");
    }

    // Generate embedding
    console.log(`Generating embedding for document: ${metadata.mongoId}`);
    const embedding = await generateEmbedding(textToEmbed, "passage");

    if (!embedding || embedding.length !== VECTOR_SIZE) {
      throw new Error(`Invalid embedding size. Expected ${VECTOR_SIZE}, got ${embedding?.length || 0}`);
    }

    // Prepare payload for Qdrant
    const payload = {
      // Core identifiers
      id: metadata.mongoId,
      originalId: metadata.originalId,
      
      // Content fields for RAG
      title: metadata.title || "",
      content: metadata.content || "",
      
      // Source information
      source: metadata.source,
      
      // Chunking information
      chunkIndex: metadata.chunkIndex || 0,
      totalChunks: metadata.totalChunks || 1,
      chunkLength: metadata.chunkLength || textToEmbed.length,
      originalLength: metadata.originalLength || 0,
      
      // Timestamps
      createdAt: new Date().toISOString(),
      lastUpdated: metadata.date || metadata.lastUpdated || new Date().toISOString(),
      
      // Source-specific metadata
      ...(metadata.source === "gmail" && {
        from: metadata.from,
        threadId: metadata.threadId,
        emailDate: metadata.date
      }),
      
      ...(metadata.source === "drive" && {
        mimeType: metadata.mimeType,
        size: metadata.size,
        webViewLink: metadata.webViewLink,
        owners: metadata.owners,
        createdDate: metadata.createdDate
      }),
      
      ...(metadata.source === "calendar" && {
        startDate: metadata.date,
        endDate: metadata.endDate,
        location: metadata.location,
        attendees: metadata.attendees,
        organizer: metadata.organizer,
        status: metadata.status,
        webLink: metadata.webLink
      }),
      
      // Additional metadata
      textLength: textToEmbed.length,
      embeddingGenerated: true
    };

    // Upsert point to Qdrant
    await quad.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: uuidv4(), // Qdrant point ID (different from document ID)
          vector: embedding,
          payload: payload
        }
      ]
    });

    console.log(`Successfully stored document ${metadata.mongoId} in Qdrant (source: ${metadata.source})`);
    
  } catch (error) {
    console.error(`Failed to upload document ${metadata.mongoId} to Qdrant:`, error.message);
    throw error;
  }
};

/**
 * Search for similar documents in Qdrant
 * @param {string} queryText - Search query
 * @param {Object} options - Search options
 * @returns {Array} Search results
 */
export const searchVectorDB = async (queryText, options = {}) => {
  try {
    const {
      limit = 10,
      scoreThreshold = 0.7,
      source = null, // Filter by source (gmail, drive, calendar)
      includeContent = true
    } = options;

    // Generate query embedding
    console.log(`Searching for: "${queryText}"`);
    const queryEmbedding = await generateEmbedding(queryText, "query");

    // Prepare search request
    const searchRequest = {
      vector: queryEmbedding,
      limit: limit,
      score_threshold: scoreThreshold,
      with_payload: true,
      with_vector: false
    };

    // Add source filter if specified
    if (source) {
      searchRequest.filter = {
        must: [
          {
            key: "source",
            match: {
              value: source
            }
          }
        ]
      };
    }

    // Execute search
    const searchResults = await quad.search(COLLECTION_NAME, searchRequest);

    // Format results for RAG
    const formattedResults = searchResults.map(result => ({
      id: result.payload.id,
      originalId: result.payload.originalId,
      score: result.score,
      title: result.payload.title,
      content: includeContent ? result.payload.content : "",
      source: result.payload.source,
      chunkIndex: result.payload.chunkIndex,
      totalChunks: result.payload.totalChunks,
      date: result.payload.lastUpdated,
      
      // Source-specific fields
      ...(result.payload.source === "gmail" && {
        from: result.payload.from,
        emailDate: result.payload.emailDate
      }),
      
      ...(result.payload.source === "drive" && {
        mimeType: result.payload.mimeType,
        webViewLink: result.payload.webViewLink
      }),
      
      ...(result.payload.source === "calendar" && {
        startDate: result.payload.startDate,
        endDate: result.payload.endDate,
        location: result.payload.location,
        organizer: result.payload.organizer
      })
    }));

    console.log(`Found ${formattedResults.length} relevant documents`);
    return formattedResults;
    
  } catch (error) {
    console.error("Error searching vector database:", error.message);
    throw error;
  }
};

/**
 * Search by source type (gmail, drive, calendar)
 * @param {string} queryText - Search query
 * @param {string} source - Source type
 * @param {Object} options - Additional search options
 * @returns {Array} Search results
 */
export const searchBySource = async (queryText, source, options = {}) => {
  return await searchVectorDB(queryText, { ...options, source });
};

/**
 * Get document statistics from Qdrant
 * @returns {Object} Statistics
 */
export const getVectorDBStats = async () => {
  try {
    const collectionInfo = await quad.getCollection(COLLECTION_NAME);
    
    // Get source distribution using scroll
    const scrollResult = await quad.scroll(COLLECTION_NAME, {
      limit: 1000,
      with_payload: ["source"],
      with_vector: false
    });

    const sourceDistribution = {};
    scrollResult.points.forEach(point => {
      const source = point.payload.source || "unknown";
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
    });

    return {
      totalPoints: collectionInfo.points_count,
      vectorSize: collectionInfo.config.params.vectors.size,
      distance: collectionInfo.config.params.vectors.distance,
      sourceDistribution,
      status: collectionInfo.status
    };
    
  } catch (error) {
    console.error("Error getting vector DB stats:", error.message);
    return { error: error.message };
  }
};

/**
 * Delete documents by source or specific IDs
 * @param {Object} criteria - Deletion criteria
 * @returns {Object} Deletion result
 */
export const deleteFromVectorDB = async (criteria) => {
  try {
    const { source, documentIds, originalId } = criteria;
    
    let filter = null;
    
    if (source) {
      filter = {
        must: [
          {
            key: "source",
            match: { value: source }
          }
        ]
      };
    } else if (originalId) {
      filter = {
        must: [
          {
            key: "originalId",
            match: { value: originalId }
          }
        ]
      };
    } else if (documentIds && documentIds.length > 0) {
      filter = {
        must: [
          {
            key: "id",
            match: { any: documentIds }
          }
        ]
      };
    }

    if (!filter) {
      throw new Error("No valid deletion criteria provided");
    }

    const deleteResult = await quad.delete(COLLECTION_NAME, {
      filter: filter,
      wait: true
    });

    console.log(`Deleted documents matching criteria:`, criteria);
    return deleteResult;
    
  } catch (error) {
    console.error("Error deleting from vector DB:", error.message);
    throw error;
  }
};

/**
 * Update collection schema if needed
 * @returns {boolean} Success status
 */
export const updateCollectionSchema = async () => {
  try {
    // Add any new payload schema if needed
    // This is useful for when we add new metadata fields
    
    console.log("Collection schema is up to date");
    return true;
    
  } catch (error) {
    console.error("Error updating collection schema:", error.message);
    return false;
  }
};

/**
 * Hybrid search combining vector similarity and keyword matching
 * @param {string} queryText - Search query
 * @param {Object} options - Search options
 * @returns {Array} Combined search results
 */
export const hybridSearch = async (queryText, options = {}) => {
  try {
    const {
      limit = 10,
      scoreThreshold = 0.5,
      source = null,
      keywordWeight = 0.3,
      vectorWeight = 0.7
    } = options;

    // Get vector similarity results
    const vectorResults = await searchVectorDB(queryText, {
      limit: limit * 2, // Get more results for re-ranking
      scoreThreshold: scoreThreshold * 0.8, // Lower threshold for initial filtering
      source,
      includeContent: true
    });

    // Simple keyword matching for title and content
    const keywords = queryText.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    const hybridResults = vectorResults.map(result => {
      const title = (result.title || "").toLowerCase();
      const content = (result.content || "").toLowerCase();
      const text = `${title} ${content}`;
      
      // Calculate keyword match score
      const keywordMatches = keywords.filter(keyword => text.includes(keyword)).length;
      const keywordScore = keywordMatches / keywords.length;
      
      // Combine scores
      const hybridScore = (result.score * vectorWeight) + (keywordScore * keywordWeight);
      
      return {
        ...result,
        hybridScore,
        keywordScore,
        vectorScore: result.score
      };
    });

    // Sort by hybrid score and return top results
    const sortedResults = hybridResults
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);

    console.log(`Hybrid search returned ${sortedResults.length} results for: "${queryText}"`);
    return sortedResults;
    
  } catch (error) {
    console.error("Error in hybrid search:", error.message);
    throw error;
  }
};
