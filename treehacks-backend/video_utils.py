import os
import json
import subprocess
from typing import Dict, List, Optional
from datetime import datetime

def format_timestamp(seconds: float) -> str:
    """Convert seconds to HH:MM:SS format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"

def extract_audio(video_path: str, test_mode: bool = False) -> Optional[str]:
    """
    Extract audio from video file using FFmpeg.
    Saves the audio file in a parallel 'audio' directory.
    
    Args:
        video_path (str): Path to the video file
        test_mode (bool): If True, extract a shorter segment with lower quality
    
    Returns:
        Optional[str]: Path to the extracted audio file, or None if extraction failed
    """
    try:
        # Create audio directory parallel to video directory
        video_dir = os.path.dirname(video_path)
        base_dir = os.path.dirname(video_dir)
        audio_dir = os.path.join(base_dir, "audio")
        os.makedirs(audio_dir, exist_ok=True)
        
        # Generate output audio path with timestamp
        base_name = os.path.splitext(os.path.basename(video_path))[0]
        audio_name = f"{base_name}_audio.mp3"
        audio_path = os.path.join(audio_dir, audio_name)
        
        # Extract audio using FFmpeg
        command = [
            "ffmpeg", "-y",  # Overwrite output files
            "-i", video_path,  # Input
        ]
        
        if test_mode:
            # For testing: 45 seconds from 3:30 to 4:15
            command.extend([
                "-ss", "210",  # Start at 3:30 (210 seconds)
                "-t", "45",    # Duration of 45 seconds
                "-vn",         # No video
                "-ar", "16000",  # 16kHz sampling (minimum for decent speech)
                "-ac", "1",    # Mono
                "-b:a", "32k", # Low bitrate
            ])
        else:
            # Full quality for production (fuck that im going small)
            command.extend([
                "-vn",  # No video
                "-ar", "16000",  # 16kHz sampling (minimum for decent speech)
                "-ac", "1",    # Mono
                "-b:a", "32k", # Low bitrate
            ])
        
        command.append(audio_path)
        
        # Run FFmpeg
        result = subprocess.run(command, check=True, capture_output=True)
        print(f"Audio extracted and saved to: {audio_path}")
        return audio_path
        
    except subprocess.CalledProcessError as e:
        print(f"Error extracting audio: {e.stderr.decode()}")
        return None
    except Exception as e:
        print(f"Error extracting audio: {str(e)}")
        return None