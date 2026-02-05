#!/bin/bash
source venv/bin/activate
echo "Starting MkDocs server on http://localhost:8005..."
mkdocs serve -a localhost:8005
