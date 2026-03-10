import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class ConfigError(Exception):
    """Raised when required configuration is missing"""
    pass

class Config:
    """Configuration loader that reads from .env"""
    
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_model = os.getenv("GROQ_MODEL")
        self.embedding_model = os.getenv("EMBEDDING_MODEL")
        
        # Validate that all required configurations are present
        self._validate()
    
    def _validate(self):
        """Validate that all required environment variables are set"""
        missing_vars = []
        
        if not self.groq_api_key:
            missing_vars.append("GROQ_API_KEY")
        if not self.groq_model:
            missing_vars.append("GROQ_MODEL")
        if not self.embedding_model:
            missing_vars.append("EMBEDDING_MODEL")
        
        if missing_vars:
            raise ConfigError(
                f"Missing required environment variables: {', '.join(missing_vars)}. "
                f"Please set them in your .env file."
            )

# Create and expose config object for import
config = Config()
