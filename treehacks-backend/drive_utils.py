import os
import requests

def download_file(file_id: str, save_path: str) -> bool:
    """
    Downloads a file from Google Drive using direct download link.
    Just make the file shareable with 'Anyone with the link' in Google Drive.
    
    Args:
        file_id (str): The ID from the Google Drive sharing link
        save_path (str): Where to save the file
    """
    try:
        # Create the direct download link
        url = f"https://drive.google.com/uc?export=download&id={file_id}"
        
        # Download the file
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad status codes
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Save the file
        with open(save_path, 'wb') as f:
            f.write(response.content)
            
        print(f"File downloaded successfully to {save_path}")
        return True
        
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return False

def download_files_to_data(file_ids: list[str]) -> list[str]:
    """
    Downloads multiple files from Google Drive to the data directory.
    
    Args:
        file_ids (list[str]): List of Google Drive file IDs
    """
    downloaded_paths = []
    data_dir = "data"
    os.makedirs(data_dir, exist_ok=True)
    
    for i, file_id in enumerate(file_ids):
        # Save with a simple numbered name since we can't get the original filename easily
        save_path = os.path.join(data_dir, f"file_{i+1}")
        
        if download_file(file_id, save_path):
            downloaded_paths.append(save_path)
    
    return downloaded_paths


def download_lecture_and_slides():
    lecture_file_id = "1za5cTP95T0XxvOhR_NXW5SVx0OuWDJkZ"  # From the second part of the concatenated URL
    slides_file_id = "1G8dZEF49OhJ5OjE6iCVp5lEbs1R5P2c6"
    
    # Download both files
    paths = download_files_to_data([lecture_file_id, slides_file_id])
    
    # Rename files to meaningful names
    if len(paths) == 2:
        os.rename(paths[0], "data/lecture.mp4")
        os.rename(paths[1], "data/slides.pdf")
        return ["data/lecture.mp4", "data/slides.pdf"]
    return paths
