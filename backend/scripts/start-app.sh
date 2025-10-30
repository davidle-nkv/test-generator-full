#!/bin/bash

###############################################
# Spring Boot Application Launcher (Secure)
# Usage:
#   ./start-app.sh [profile] [github_pat]
# If not provided, defaults will be used.
###############################################

### 1. Read inputs or use defaults
PROFILE=${1:-qa}   # default profile = qa
PAT_INPUT=${2:-""} # no default for PAT to encourage secure input
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="app-$TIMESTAMP.log"

### 2. If PAT not passed as argument, ask securely (hidden input)
if [ -z "$PAT_INPUT" ]; then
  echo -n "Enter your GitHub PAT (input hidden): "
  read -s PAT_INPUT
  echo ""
fi

### 3. Export environment variables
export SPRING_PROFILES_ACTIVE="$PROFILE"
export GITHUB_PAT="$PAT_INPUT"

### Stop existing app (optional safe stop)
echo "Checking for existing application process..."
PID=$(ps -ef | grep test-generator | grep java | awk '{print $2}')
if [ -n "$PID" ]; then
  echo "Stopping existing process with PID: $PID"
  kill -9 $PID
  sleep 1
else
  echo "No existing process found."
fi

### 4. Select latest JAR file
echo "Finding latest JAR file..."
LATEST_JAR=$(ls -t test-generator-*.jar | head -n 1)
if [ -z "$LATEST_JAR" ]; then
  echo "❌ No JAR file found. Deployment aborted."
  exit 1
fi
echo "Starting application using: $LATEST_JAR"

### 5. Clean old jars
# echo "🧹 Cleaning old builds..."
# ls -t test-generator-*.jar | tail -n +$((KEEP_BUILD+1)) | xargs -r rm -f

### 5. Start your Spring Boot app
nohup java -jar "$LATEST_JAR" > $LOG_FILE 2>&1 &

echo "✅ Application started."
echo "🔍 Check logs using: tail -f $LOG_FILE"
echo "🔒 Environment variables securely loaded."
