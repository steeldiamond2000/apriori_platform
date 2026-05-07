import os
import json
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
from utils.apriori_engine import run_apriori
import pandas as pd
import traceback

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB max
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Helper function to get supported languages
def get_language_dict(lang):
    file_path = os.path.join('languages', f'{lang}.json')
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/languages/<lang>')
def get_language(lang):
    if lang not in ['uz', 'en', 'ru']:
        return jsonify({"error": "Language not supported"}), 400
    return jsonify(get_language_dict(lang))

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({"success": False, "error": "Only CSV files are supported"}), 400

    min_support = float(request.form.get('min_support', 0.05))
    min_confidence = float(request.form.get('min_confidence', 0.2))
    max_rules = int(request.form.get('max_rules', 100))

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        results = run_apriori(filepath, min_support, min_confidence, max_rules)
        return jsonify({
            "success": True,
            "rules": results['rules'],
            "frequent_itemsets_count": results['frequent_itemsets_count'],
            "total_rules": results['total_rules']
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        # Optionally clean up the file after processing
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
