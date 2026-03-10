"""
TEXT CLASSIFICATION SERVICE
============================
This service classifies text into categories (e.g., 'scam', 'danger') using:
1. EMBEDDINGS: Convert text & keywords into numerical vectors (meaning representation)
2. SIMILARITY: Compare text vector with keyword vectors
3. SCORING: Calculate which category text belongs to

Flow: Text → Vector → Compare → Score → Best Category
"""

import numpy as np
from services.embeddings import embedding_service
from services.keywords_database import get_all_keywords, get_categories
import logging
from typing import Dict, Tuple

logger = logging.getLogger(__name__)

# Minimum similarity (0-1) for a keyword to count as "matching"
# 0.35 = keyword must be at least 35% similar to be counted
KEYWORD_THRESHOLD = 0.35

# Minimum score (0-1) for text to be considered valid for a category
# 0.25 = text must score at least 0.25 to match
VALID_THRESHOLD = 0.25


class ClassificationError(Exception):
    """Raised when classification service encounters an error"""
    pass


class CategoryValidator:
    """
    Text classification using semantic similarity and keyword matching.
    
    HOW IT WORKS:
    ============
    1. SETUP: Load all keywords for each category and convert to vectors (embeddings)
    2. CLASSIFY: When given text:
       a) Convert text to vector
       b) Compare text vector with each category's keyword vectors
       c) Count how many keywords match (similarity >= 0.35)
       d) Calculate score: 40% from matching keywords, 60% from similarity strength
       e) Return category with highest score
    """
    
    def __init__(self, threshold: float = VALID_THRESHOLD):
        self.threshold = threshold
        self._keyword_embeddings: Dict[str, np.ndarray] = {}
        self._initialize_keywords()
        logger.info(f"CategoryValidator ready (threshold: {threshold})")
    
    def _initialize_keywords(self):
        """STEP 1: Load and cache keyword embeddings for all categories."""
        try:
            for category in get_categories():
                # Get all keywords for this category
                keywords = get_all_keywords(category)
                
                # Convert each keyword to a vector (embedding)
                embeddings = embedding_service.get_embeddings(keywords)
                
                # Store for later use during classification
                self._keyword_embeddings[category] = embeddings
                
                logger.info(f"Loaded {len(keywords)} keywords for '{category}'")
        except Exception as e:
            msg = f"Failed to initialize keywords: {str(e)}"
            logger.error(msg)
            raise ClassificationError(msg) from e
    
    def _score_categories(self, text_embedding: np.ndarray) -> Tuple[Dict[str, float], Dict[str, Dict]]:
        """
        STEP 2 & 3: Compare text vector with keywords and score each category.
        
        For each category:
        - Calculate similarity between text and each keyword
        - Count keywords that match (similarity >= 0.35)
        - Score = (40% × avg_matching_similarity) + (60% × matching_percentage)
        """
        scores = {}
        matches = {}
        
        for category, keyword_embeddings in self._keyword_embeddings.items():
            # COMPARE: Generate similarity score between text and each keyword vector
            # Result: [0.92, 0.45, 0.88, 0.12, ...] each number is similarity to one keyword
            similarities = np.dot(keyword_embeddings, text_embedding)
            
            # MATCH: Find keywords that exceeded threshold (0.35)
            # These are the keywords that are similar enough to count
            matching_indices = np.where(similarities >= KEYWORD_THRESHOLD)[0]
            num_matches = len(matching_indices)
            
            # SCORE: Calculate category score based on matches
            if num_matches > 0:
                # We have matches! Use high-quality scoring
                avg_sim = float(np.mean(similarities[matching_indices]))  # Average similarity of matches
                match_pct = num_matches / len(keyword_embeddings)         # % of keywords that matched
                match_bonus = min(match_pct * 0.8, 0.8)                  # Bonus for matches (max 0.8)
                
                # Final score: 40% from quality, 60% from quantity of matches
                score = avg_sim * 0.4 + match_bonus * 0.6
            else:
                # No matches, use fallback scoring (only best match at 20%)
                score = float(np.max(similarities)) * 0.2
            
            scores[category] = score
            
            # Store match details for debugging/logging
            matches[category] = {
                "matches": num_matches,
                "total": len(keyword_embeddings),
                "percentage": (num_matches / len(keyword_embeddings) * 100) if keyword_embeddings.size > 0 else 0
            }
        
        return scores, matches
    
    def classify(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        """
        CLASSIFY TEXT INTO A CATEGORY
        
        Process:
        1. Convert text to vector
        2. Score all categories
        3. Return category with highest score
        
        Returns: (category_name, confidence_score, all_category_scores)
        """
        # Input validation
        if not text or not isinstance(text, str) or len(text.strip()) == 0:
            raise ClassificationError("Text cannot be empty")
        
        try:
            # STEP 1: Convert input text to a vector (embedding)
            text_embedding = embedding_service.get_embedding(text)
            
            # STEP 2: Score all categories by comparing with keywords
            scores, matches = self._score_categories(text_embedding)
            
            # STEP 3: Find the category with highest score (winner)
            best_category = max(scores, key=scores.get)
            confidence = scores[best_category]
            
            logger.info(
                f"✓ Classified as '{best_category}' (confidence: {confidence:.2f}, "
                f"matches: {matches[best_category]['matches']}/{matches[best_category]['total']})"
            )
            
            return best_category, confidence, scores
        except Exception as e:
            msg = f"Classification failed: {str(e)}"
            logger.error(msg)
            raise ClassificationError(msg) from e
    
    def validate(self, text: str, category: str) -> bool:
        """
        VALIDATE IF TEXT MATCHES A SPECIFIC CATEGORY
        
        Process:
        1. Classify text (get best category for it)
        2. Check if best_category == requested_category
        3. Check if score >= threshold
        4. Return True only if BOTH conditions pass
        
        Example:
        - Text: "I was scammed"
        - Requested: 'scam'
        - Prediction: 'scam' (match ✓) with score 0.48 (>= 0.25 ✓) → Valid!
        - Requested: 'danger'
        - Prediction: 'scam' (no match ✗) → Invalid!
        """
        # Input validation
        if not text or not isinstance(text, str) or len(text.strip()) == 0:
            raise ClassificationError("Text cannot be empty")
        if not category or not isinstance(category, str) or len(category.strip()) == 0:
            raise ClassificationError("Category cannot be empty")
        if category not in self._keyword_embeddings:
            available = list(self._keyword_embeddings.keys())
            raise ClassificationError(f"Unknown category '{category}'. Available: {available}")
        
        try:
            # Classify the text
            text_embedding = embedding_service.get_embedding(text)
            scores, _ = self._score_categories(text_embedding)
            
            # Get predictions
            predicted_category = max(scores, key=scores.get)  # What we think it is
            selected_score = scores[category]                  # How well it matches requested category
            
            # VALIDATION: Both conditions must be true
            is_match = (
                predicted_category == category  # Predicted category must match requested
                and selected_score >= self.threshold  # AND score must exceed threshold
            )
            
            result = "✓ VALID" if is_match else "✗ INVALID"
            logger.info(f"{result}: '{category}' (score: {selected_score:.2f}, threshold: {self.threshold})")
            return is_match
        except Exception as e:
            msg = f"Validation failed: {str(e)}"
            logger.error(msg)
            raise ClassificationError(msg) from e


# ============================================================================
# SINGLETON INSTANCE - Created once at startup
# ============================================================================
validator = CategoryValidator(threshold=VALID_THRESHOLD)


# ============================================================================
# PUBLIC API FUNCTIONS - Used by routing/validate.py
# ============================================================================

def classify(text: str) -> Dict:
    """
    PUBLIC: Classify text to best matching category.
    
    Args:
        text: Input text to classify
    
    Returns:
        category name (e.g., "scam", "danger")
    """
    category, confidence, _ = validator.classify(text)
    return {"category": category, "confidence": confidence}


def validate(text: str, category: str) -> Dict:
    """
    PUBLIC: Validate if text matches a specific category.
    
    Args:
        text: Input text to validate
        category: Expected category
    
    Returns:
        {
            "valid": true,           # Does text match requested category?
            "category": "scam",      # What we check against
            "confidence": 0.48       # How confident the classification is
        }
    """
    is_valid = validator.validate(text, category)
    _, confidence, _ = validator.classify(text)
    return {
        "valid": is_valid,
        "category": category,
        "confidence": float(confidence)
    }
