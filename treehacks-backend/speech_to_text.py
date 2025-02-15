import os
import json
from typing import Dict, Optional
from datetime import datetime
from openai import OpenAI
from video_utils import extract_audio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

def transcribe_with_timestamps(video_path: str, test_mode: bool = False) -> Optional[Dict]:
    """
    Transcribe video using OpenAI's Whisper API with phrase-level timestamps.
    Uses the API's natural segmentation.
    
    Args:
        video_path (str): Path to the video file
        test_mode (bool): If True, use a shorter segment for testing
    
    Returns:
        Optional[Dict]: Transcription with phrase-level timestamps
    """
    try:
        # First extract audio
        audio_path = extract_audio(video_path, test_mode=test_mode)
        if not audio_path:
            print("Failed to extract audio from video")
            return None
            
        print("Transcribing with OpenAI Whisper API...")
        with open(audio_path, 'rb') as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["word", "segment"]
            )
            
            # Convert response to dictionary
            response_dict = dict(response)
            
            # Save raw response for debugging
            transcription_dir = os.path.join(os.path.dirname(os.path.dirname(video_path)), "transcriptions")
            os.makedirs(transcription_dir, exist_ok=True)
            
            timestamp = "lecture" #datetime.now().strftime("%Y%m%d_%H%M%S")
            debug_path = os.path.join(transcription_dir, f"debug_response_{timestamp}.json")
            
            with open(debug_path, 'w') as f:
                json.dump(response_dict, f, indent=2)
            print(f"Raw response saved to: {debug_path}")
            
            # Add time offset for test mode
            time_offset = 210 if test_mode else 0  # 3:30 offset in test mode
            
            # Use API's segments directly
            segments = []
            for segment in response_dict.get("segments", []):
                segments.append({
                    "text": segment["text"].strip(),
                    "start": segment["start"] + time_offset,
                    "end": segment["end"] + time_offset
                })
            
            # Create final result
            result = {
                "text": response_dict.get("text", ""),
                "segments": segments
            }
            
            # Save formatted output
            output_path = os.path.join(transcription_dir, f"transcription_{timestamp}.json")
            with open(output_path, 'w') as f:
                json.dump(result, f, indent=2)
            
            print(f"Transcription saved to: {output_path}")
            return result
        
    except Exception as e:
        print(f"Error in transcription: {str(e)}")
        return None
