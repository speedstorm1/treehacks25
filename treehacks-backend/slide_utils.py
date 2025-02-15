import os
import cv2
import numpy as np
from pdf2image import convert_from_path
import pytesseract
from typing import List, Dict, Tuple
import json
from datetime import datetime

def extract_text_from_image(image: np.ndarray) -> str:
    """
    Extract text from an image using OCR
    
    Args:
        image: Input image as numpy array
    
    Returns:
        Extracted text as string
    """
    # Convert to grayscale if color
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
        
    # Threshold to get black text on white background
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Extract text using OCR
    text = pytesseract.image_to_string(thresh)
    return text.strip()

def extract_frames_with_text(video_path: str, interval: float = 3.0) -> List[Tuple[float, str]]:
    """
    Extract frames from video and convert to text
    
    Args:
        video_path: Path to video file
        interval: Time interval between frames in seconds
    
    Returns:
        List of tuples containing (timestamp, extracted text)
    """
    frames_text = []
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print("Error: Could not open video")
        return frames_text
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_interval = int(fps * interval)
    duration = total_frames/fps
    
    print(f"Processing {duration:.1f}s video at {interval}s intervals...")
    
    for frame_count in range(0, total_frames, frame_interval):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_count)
        ret, frame = cap.read()
        if not ret:
            break
            
        timestamp = frame_count / fps
        text = extract_text_from_image(frame)
        
        if text:  # Only keep frames that have text
            frames_text.append((timestamp, text))
    
    cap.release()
    print(f"Extracted text from {len(frames_text)} frames")
    return frames_text

def extract_slides_text(pdf_path: str) -> List[str]:
    """
    Convert PDF slides to text
    
    Args:
        pdf_path: Path to PDF file
    
    Returns:
        List of text content from each slide
    """
    print("Converting PDF slides to text...")
    images = convert_from_path(pdf_path)
    slides_text = []
    
    for i, image in enumerate(images):
        # Convert PIL image to numpy array
        np_image = np.array(image)
        text = extract_text_from_image(np_image)
        
        if text:  # Only keep slides that have text
            slides_text.append(text)
    
    print(f"Extracted text from {len(slides_text)} slides")
    return slides_text

def map_slides_to_video(video_path: str, pdf_path: str) -> Dict:
    """
    Map slides to video timestamps using text matching
    
    Args:
        video_path: Path to video file
        pdf_path: Path to PDF file
    
    Returns:
        Dictionary containing slide mapping information
    """
    # Extract text from slides and frames
    slides_text = extract_slides_text(pdf_path)
    frames_text = extract_frames_with_text(video_path)
    
    total_slides = len(slides_text)
    print(f"\nMatching {len(frames_text)} frames to {total_slides} slides...")
    
    # Create output directory
    output_dir = os.path.join(os.path.dirname(os.path.dirname(video_path)), "slide_mappings")
    os.makedirs(output_dir, exist_ok=True)
    
    # Store timestamps for each slide
    slide_timestamps = []
    matched_pairs = []
    
    # Keep track of which slides we've found
    available_slides = set(range(total_slides))
    last_matched_index = -1
    
    # For each frame, try to match it to a slide
    for timestamp, frame_text in frames_text:
        # Get the next 5 available slides after last_matched_index
        next_slides = []
        current_index = last_matched_index + 1
        while len(next_slides) < 5 and current_index < total_slides:
            if current_index in available_slides:
                next_slides.append(current_index)
            current_index += 1
        
        if not next_slides:
            break
        
        # Find best matching slide
        best_score = 0
        best_index = -1
        
        for slide_index in next_slides:
            slide_text = slides_text[slide_index]
            
            # Calculate text similarity score
            frame_words = set(frame_text.lower().split())
            slide_words = set(slide_text.lower().split())
            
            if not frame_words or not slide_words:
                continue
                
            # Use Jaccard similarity
            intersection = len(frame_words & slide_words)
            union = len(frame_words | slide_words)
            score = intersection / union if union > 0 else 0
            
            if score > best_score:
                best_score = score
                best_index = slide_index
        
        # Only consider it a match if the score is good enough
        if best_score >= 0.3 and best_index > last_matched_index:
            # Add any missing slides between last_matched_index and best_index
            missing_count = 0
            for missing_index in range(last_matched_index + 1, best_index):
                if missing_index in available_slides:
                    slide_timestamps.append({
                        "slide": missing_index + 1,
                        "timestamp": timestamp
                    })
                    available_slides.remove(missing_index)
                    missing_count += 1
            
            # Add the current slide
            slide_timestamps.append({
                "slide": best_index + 1,
                "timestamp": timestamp
            })
            available_slides.remove(best_index)
            
            # Save the matched pair
            matched_pairs.append({
                "timestamp": timestamp,
                "slide": best_index + 1,
                "match_score": float(best_score)
            })
            
            print(f"Found slide {best_index + 1} at {timestamp:.1f}s (score: {best_score:.3f})")
            
            last_matched_index = best_index
    
    # Create the final output
    output = {
        "video_path": video_path,
        "pdf_path": pdf_path,
        "total_slides": total_slides,
        "slide_timestamps": slide_timestamps,
        "matched_pairs": matched_pairs,
        "timestamp": datetime.now().isoformat()
    }
    
    # Save the mapping to a JSON file
    output_path = os.path.join(output_dir, "slide_mapping.json")
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\nFound {len(slide_timestamps)}/{total_slides} slides")
    print(f"Mapping saved to: {output_path}")
    
    return output
