import { Router } from 'express';
import { processDocument } from '../documentProcessor';

const router = Router();

/**
 * API endpoint to upload a document to the knowledge base
 * POST /api/documents
 * {
 *   "title": "Document Title",
 *   "content": "Document content to be vectorized and stored",
 *   "source": "Optional source information",
 *   "category": "Optional category for organization"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, source = 'User uploaded', category = 'General' } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }
    
    // Process and add document to vector store
    const result = await processDocument(content, {
      title,
      source,
      category,
      created_at: new Date().toISOString()
    });
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        message: `Document "${title}" added to knowledge base`,
        chunks: result.count
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to add document to knowledge base',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing document',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * API endpoint to upload multiple documents at once
 * POST /api/documents/bulk
 * {
 *   "documents": [
 *     {
 *       "title": "Document 1 Title",
 *       "content": "Document 1 content",
 *       "source": "Optional source",
 *       "category": "Optional category"
 *     },
 *     ...
 *   ]
 * }
 */
router.post('/bulk', async (req, res) => {
  try {
    const { documents } = req.body;
    
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The request must include a non-empty array of documents'
      });
    }
    
    // Validate each document has required fields
    for (const doc of documents) {
      if (!doc.title || !doc.content) {
        return res.status(400).json({
          success: false,
          message: 'Each document must have a title and content'
        });
      }
    }
    
    // Process documents in the format expected by the bulk processor
    const formattedDocs = documents.map(doc => ({
      text: doc.content,
      metadata: {
        title: doc.title,
        source: doc.source || 'User uploaded',
        category: doc.category || 'General',
        created_at: new Date().toISOString()
      }
    }));
    
    // Import docs from the browser
    const { processBulkDocuments } = await import('../documentProcessor');
    const result = await processBulkDocuments(formattedDocs);
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        message: `${documents.length} documents added to knowledge base`,
        chunks: result.count
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to add documents to knowledge base',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error uploading documents in bulk:', error);
    return res.status(500).json({
      success: false, 
      message: 'Server error while processing documents',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;