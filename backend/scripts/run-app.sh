#!/bin/bash

###############################################
# Spring Boot Application Launcher (Secure)
# Usage:
#   ./start-app.sh [profile] [github_pat]
# If not provided, defaults will be used.
###############################################

# 1️⃣ Read inputs or use defaults
PROFILE=${1:-qa}   # default profile = qa
PAT_INPUT=${2:-""} # no default for PAT to encourage secure input

# 2️⃣ If PAT not passed as argument, ask securely (hidden input)
if [ -z "$PAT_INPUT" ]; then
  echo -n "Enter your GitHub PAT (input hidden): "
  read -s PAT_INPUT
  echo ""
fi

# 3️⃣ Export environment variables
export SPRING_PROFILES_ACTIVE="$PROFILE"
export GITHUB_PAT="$PAT_INPUT"

# 4️⃣ Stop existing app (optional safe stop)
echo "Checking for existing application process..."
PID=$(ps -ef | grep test-generator | grep java | awk '{print $2}')
if [ -n "$PID" ]; then
  echo "Stopping existing process with PID: $PID"
  kill -9 $PID
  sleep 1
else
  echo "No existing process found."
fi

# 5️⃣ Start your Spring Boot app
echo "Starting application with profile: $PROFILE ..."
nohup java -jar test-generator-1.0.SNAPSHOT-local.jar > app.log 2>&1 &

echo "✅ Application started."
echo "🔍 Check logs using: tail -f app.log"
echo "🔒 Environment variables securely loaded."
