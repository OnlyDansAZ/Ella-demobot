#!/bin/bash
# YoBot Voice CDN Tool
# A simple utility script to prepare and upload ElevenLabs audio files to a CDN for SignalWire calls

# Set default values
OUTPUT_DIR="./audio"
S3_BUCKET=""
S3_PREFIX="audio"
PROFILE=""

# Usage information
function show_usage {
  echo "YoBot Voice CDN Tool"
  echo "===================================================="
  echo "A utility to prepare and upload ElevenLabs audio for SignalWire calls"
  echo
  echo "Usage:"
  echo "  $0 [options] <text-content>"
  echo
  echo "Options:"
  echo "  -h, --help                Show this help message"
  echo "  -o, --output DIR          Set output directory (default: ./audio)"
  echo "  -v, --voice ID            Set ElevenLabs voice ID (default: female voice)"
  echo "  -b, --bucket NAME         S3 bucket name"
  echo "  -p, --prefix PATH         S3 prefix/path (default: audio)"
  echo "  -P, --profile NAME        AWS profile name"
  echo "  --optimize                Optimize audio for telephony (requires ffmpeg)"
  echo "  --test-url                Test if the URL is publicly accessible"
  echo
  echo "Example:"
  echo "  $0 -b my-audio-bucket -v female \"Hello, this is YoBot calling.\""
  echo
  exit 1
}

# Parse command line arguments
OPTIMIZE=false
TEST_URL=false
POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_usage
      ;;
    -o|--output)
      OUTPUT_DIR="$2"
      shift
      shift
      ;;
    -v|--voice)
      VOICE_ID="$2"
      shift
      shift
      ;;
    -b|--bucket)
      S3_BUCKET="$2"
      shift
      shift
      ;;
    -p|--prefix)
      S3_PREFIX="$2"
      shift
      shift
      ;;
    -P|--profile)
      PROFILE="$2"
      shift
      shift
      ;;
    --optimize)
      OPTIMIZE=true
      shift
      ;;
    --test-url)
      TEST_URL=true
      shift
      ;;
    -*|--*)
      echo "Unknown option $1"
      show_usage
      ;;
    *)
      POSITIONAL_ARGS+=("$1")
      shift
      ;;
  esac
done

set -- "${POSITIONAL_ARGS[@]}"

# Check for required arguments
if [ -z "$1" ]; then
  echo "Error: Text content is required"
  show_usage
fi

# Check for ElevenLabs API key
if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "Error: ELEVENLABS_API_KEY environment variable is not set"
  exit 1
fi

# Set default voice ID if not provided
if [ -z "$VOICE_ID" ]; then
  # Using default ElevenLabs female voice
  VOICE_ID="KgleQSAupUuS391XuXpI"
  echo "Using default female voice ID: $VOICE_ID"
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate a unique filename
TIMESTAMP=$(date +%s)
FILENAME="${VOICE_ID:0:5}-${TIMESTAMP}.mp3"
OUTPUT_FILE="$OUTPUT_DIR/$FILENAME"

echo "=================== YoBot Voice CDN Tool ==================="
echo "Generating speech audio from text..."
echo "Text: $1"
echo "Voice ID: $VOICE_ID"
echo "Output file: $OUTPUT_FILE"

# Call ElevenLabs API to generate speech
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID/stream" \
  -H "Accept: audio/mpeg" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$1\",
    \"model_id\": \"eleven_monolingual_v1\",
    \"voice_settings\": {
      \"stability\": 0.5,
      \"similarity_boost\": 0.75,
      \"style\": 0.5,
      \"use_speaker_boost\": true
    }
  }" \
  --output "$OUTPUT_FILE"

# Check if the file was created successfully
if [ ! -f "$OUTPUT_FILE" ]; then
  echo "Error: Failed to generate speech file"
  exit 1
fi

FILESIZE=$(stat -c%s "$OUTPUT_FILE" 2>/dev/null || stat -f%z "$OUTPUT_FILE")
echo "Speech generation successful! File size: $FILESIZE bytes"

# Optimize audio for telephony if requested
if [ "$OPTIMIZE" = true ]; then
  # Check if ffmpeg is installed
  if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is required for audio optimization but it's not installed"
    exit 1
  fi
  
  # Create optimized filename
  OPTIMIZED_FILE="${OUTPUT_FILE%.*}_optimized.mp3"
  
  echo "Optimizing audio for telephony..."
  echo "Output file: $OPTIMIZED_FILE"
  
  # Run ffmpeg to optimize audio
  ffmpeg -y -i "$OUTPUT_FILE" -ar 8000 -ac 1 -ab 64k -filter:a "loudnorm=I=-16:TP=-1.5:LRA=11" "$OPTIMIZED_FILE" 2>/dev/null
  
  if [ ! -f "$OPTIMIZED_FILE" ]; then
    echo "Error: Failed to optimize audio file"
    exit 1
  fi
  
  FILESIZE=$(stat -c%s "$OPTIMIZED_FILE" 2>/dev/null || stat -f%z "$OPTIMIZED_FILE")
  echo "Audio optimization successful! File size: $FILESIZE bytes"
  
  # Replace original file with optimized version
  OUTPUT_FILE="$OPTIMIZED_FILE"
fi

# Upload to S3 if bucket is provided
if [ -n "$S3_BUCKET" ]; then
  echo "Uploading audio to S3..."
  
  # Set AWS profile if provided
  PROFILE_ARG=""
  if [ -n "$PROFILE" ]; then
    PROFILE_ARG="--profile $PROFILE"
  fi
  
  # Set S3 key path
  S3_KEY="$S3_PREFIX/$(basename "$OUTPUT_FILE")"
  S3_URL="s3://$S3_BUCKET/$S3_KEY"
  
  echo "Destination: $S3_URL"
  
  # Upload file to S3
  aws $PROFILE_ARG s3 cp "$OUTPUT_FILE" "$S3_URL" --acl public-read
  
  if [ $? -ne 0 ]; then
    echo "Error: Failed to upload file to S3"
    exit 1
  fi
  
  # Generate public URL
  PUBLIC_URL="https://$S3_BUCKET.s3.amazonaws.com/$S3_KEY"
  echo "Upload successful!"
  echo "Public URL: $PUBLIC_URL"
  
  # Test if URL is publicly accessible
  if [ "$TEST_URL" = true ]; then
    echo "Testing URL accessibility..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_URL")
    
    if [ "$HTTP_CODE" = "200" ]; then
      echo "Success! URL is publicly accessible."
    else
      echo "Warning: URL returned HTTP code $HTTP_CODE. It may not be publicly accessible."
    fi
  fi
  
  # Generate SignalWire LAML example
  echo 
  echo "SignalWire LAML Example:"
  echo "=====================================>"
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<Response>'
  echo "  <Play>$PUBLIC_URL</Play>"
  echo '  <Pause length="1"/>'
  echo '  <Gather input="speech dtmf" timeout="10" action="/api/phone-call/response" method="POST">'
  echo '    <Say voice="woman" language="en-US">'
  echo '      Would you like to learn more about YoBot and what we offer?'
  echo '      Say yes or press 1 for pricing information.'
  echo '      Say no or press 2 to end this call.'
  echo '    </Say>'
  echo '  </Gather>'
  echo '  <Say voice="woman" language="en-US">We didn\'t receive your response. Thank you for your time. Goodbye.</Say>'
  echo '</Response>'
  echo "=====================================>"
fi

echo "Process completed successfully."
exit 0