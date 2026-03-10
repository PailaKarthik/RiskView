import numpy as np
from langchain_huggingface import HuggingFaceEmbeddings
from core.config import config
import logging

logger = logging.getLogger(__name__)

class EmbeddingServiceError(Exception):
    """Raised when embedding service encounters an error"""
    pass

class EmbeddingService:
    """
    Embedding service using HuggingFace models via LangChain.
    Provides normalized embeddings compatible with FAISS vector store.
    """
    
    def __init__(self, model_name: str = None):
        """
        Initialize embedding service
        
        Args:
            model_name: HuggingFace model name (defaults to EMBEDDING_MODEL from config)
        """
        self.model_name = model_name or config.embedding_model
        self._model = None
        self._dimension = None
        
        # Initialize embeddings lazily on first use
        logger.info(f"Embedding service created with model: {self.model_name}")
    
    @property
    def model(self):
        """Lazy load model on first access"""
        if self._model is None:
            try:
                logger.info(f"Loading HuggingFace embeddings model: {self.model_name}")
                self._model = HuggingFaceEmbeddings(model_name=self.model_name)
                logger.info("Embeddings model loaded successfully")
            except Exception as e:
                error_msg = f"Failed to load embeddings model: {str(e)}"
                logger.error(error_msg)
                raise EmbeddingServiceError(error_msg) from e
        
        return self._model
    
    def get_dimension(self) -> int:
        """
        Get embedding dimension
        
        Returns:
            Dimension of embeddings
        """
        if self._dimension is None:
            try:
                # Get dimension by embedding a test string
                single_embedding = self.model.embed_query("test")
                self._dimension = len(single_embedding)
                logger.info(f"Embedding dimension: {self._dimension}")
            except Exception as e:
                error_msg = f"Failed to get embedding dimension: {str(e)}"
                logger.error(error_msg)
                raise EmbeddingServiceError(error_msg) from e
        
        return self._dimension
    
    def get_embeddings(self, texts: list) -> np.ndarray:
        """
        Generate normalized embeddings for texts
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            Normalized numpy array of shape (len(texts), dimension)
            dtype=float32 for FAISS compatibility
            
        Raises:
            EmbeddingServiceError: If embedding generation fails
        """
        if not texts:
            raise EmbeddingServiceError("Texts list cannot be empty")
        
        try:
            # Generate embeddings using LangChain
            embeddings = self.model.embed_documents(texts)
            
            # Convert to numpy array with float32 dtype for FAISS
            embeddings_array = np.array(embeddings, dtype=np.float32)
            
            # Normalize embeddings (L2 normalization for cosine similarity)
            norms = np.linalg.norm(embeddings_array, axis=1, keepdims=True)
            # Avoid division by zero
            norms[norms == 0] = 1
            embeddings_array = embeddings_array / norms
            
            logger.debug(
                f"Generated {len(texts)} embeddings with shape {embeddings_array.shape}"
            )
            
            return embeddings_array
            
        except Exception as e:
            error_msg = f"Failed to generate embeddings: {str(e)}"
            logger.error(error_msg)
            raise EmbeddingServiceError(error_msg) from e
    
    def get_embedding(self, text: str) -> np.ndarray:
        """
        Generate normalized embedding for a single text
        
        Args:
            text: Text string to embed
            
        Returns:
            Normalized numpy array of shape (dimension,)
            dtype=float32
            
        Raises:
            EmbeddingServiceError: If embedding generation fails
        """
        try:
            embedding = self.model.embed_query(text)
            
            # Convert to numpy array with float32 dtype
            embedding_array = np.array(embedding, dtype=np.float32)
            
            # Normalize (L2 normalization)
            norm = np.linalg.norm(embedding_array)
            if norm > 0:
                embedding_array = embedding_array / norm
            
            return embedding_array
            
        except Exception as e:
            error_msg = f"Failed to generate embedding: {str(e)}"
            logger.error(error_msg)
            raise EmbeddingServiceError(error_msg) from e
    
    def similarity(self, text1: str, text2: str) -> float:
        """
        Calculate cosine similarity between two texts
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Cosine similarity score (0-1)
            
        Raises:
            EmbeddingServiceError: If calculation fails
        """
        try:
            emb1 = self.get_embedding(text1)
            emb2 = self.get_embedding(text2)
            
            # Cosine similarity (already normalized, so just dot product)
            similarity = float(np.dot(emb1, emb2))
            
            return similarity
            
        except Exception as e:
            error_msg = f"Failed to calculate similarity: {str(e)}"
            logger.error(error_msg)
            raise EmbeddingServiceError(error_msg) from e

# Create and expose singleton instance
embedding_service = EmbeddingService()
