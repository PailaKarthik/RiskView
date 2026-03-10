from groq import Groq
from core.config import config
import logging

logger = logging.getLogger(__name__)

class GroqLLMError(Exception):
    """Raised when Groq API encounters an error"""
    pass

class GroqLLM:
    """
    Wrapper for Groq LLM using groq Python SDK.
    Provides reusable interface for summarization, RAG, and other tasks.
    """
    
    def __init__(
        self,
        api_key: str = None,
        model: str = None,
        temperature: float = 0.3,
        max_tokens: int = 512
    ):
        """
        Initialize Groq LLM wrapper
        
        Args:
            api_key: Groq API key (defaults to GROQ_API_KEY from config)
            model: Model name (defaults to GROQ_MODEL from config)
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens in response
        """
        self.api_key = api_key or config.groq_api_key
        self.model = model or config.groq_model
        self.temperature = temperature
        self.max_tokens = max_tokens
        
        # Initialize Groq client
        self.client = Groq(api_key=self.api_key)
        
        logger.info(f"Initialized GroqLLM with model: {self.model}")
    
    def generate_completion(self, prompt: str) -> str:
        """
        Generate completion for given prompt
        
        Args:
            prompt: Input prompt text
            
        Returns:
            Generated text completion
            
        Raises:
            GroqLLMError: If API call fails
        """
        try:
            message = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=self.model,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            )
            
            completion = message.choices[0].message.content
            logger.debug(f"Generated completion for prompt: {prompt[:50]}...")
            return completion
            
        except Exception as e:
            error_msg = f"Groq API error: {str(e)}"
            logger.error(error_msg)
            raise GroqLLMError(error_msg) from e
    
    def summarize(self, text: str, max_length: int = 200) -> str:
        """
        Summarize text using Groq LLM
        
        Args:
            text: Text to summarize
            max_length: Approximate target length for summary
            
        Returns:
            Summarized text
            
        Raises:
            GroqLLMError: If summarization fails
        """
        prompt = f"""Provide a concise summary of the following text in approximately {max_length} words:

{text}

Summary:"""
        
        return self.generate_completion(prompt)
    
    def extract_keywords(self, text: str, num_keywords: int = 5) -> list:
        """
        Extract keywords from text using Groq LLM
        
        Args:
            text: Text to extract keywords from
            num_keywords: Number of keywords to extract
            
        Returns:
            List of extracted keywords
            
        Raises:
            GroqLLMError: If extraction fails
        """
        prompt = f"""Extract the {num_keywords} most important keywords as a comma-separated list from the following text:

{text}

Keywords:"""
        
        response = self.generate_completion(prompt)
        # Parse comma-separated response
        keywords = [k.strip() for k in response.split(",")]
        return keywords[:num_keywords]
    
    def answer_question(self, context: str, question: str) -> str:
        """
        Answer question based on provided context (RAG-style)
        
        Args:
            context: Reference text/context
            question: Question to answer
            
        Returns:
            Answer based on context
            
        Raises:
            GroqLLMError: If answering fails
        """
        prompt = f"""Based on the following context, answer the question concisely:

Context:
{context}

Question: {question}

Answer:"""
        
        return self.generate_completion(prompt)

# Create and expose singleton instance
llm = GroqLLM()
