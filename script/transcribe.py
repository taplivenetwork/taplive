#!/usr/bin/env python3
import sys
import whisper
import os

def transcribe_audio(audio_path):
    try:
        # Load the model (you can change to 'base', 'small', 'medium', 'large' based on your needs)
        model = whisper.load_model("tiny")  # 'tiny' is smallest and fastest

        # Transcribe the audio
        result = model.transcribe(audio_path, language='en')

        # Return the text
        return result["text"].strip()

    except Exception as e:
        print(f"Error transcribing audio: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python transcribe.py <audio_path>", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]
    if not os.path.exists(audio_path):
        print(f"Audio file not found: {audio_path}", file=sys.stderr)
        sys.exit(1)

    transcript = transcribe_audio(audio_path)
    if transcript:
        print(transcript)
    else:
        sys.exit(1)