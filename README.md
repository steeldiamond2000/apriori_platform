# Apriori Association Rule Mining Dashboard

A modern, full-stack web application for Association Rule Mining using the Apriori Algorithm. Built with Flask, pandas, mlxtend, and a futuristic glassmorphism frontend.

## Features
- **Upload CSV Dataset**: Supports generic transactional data.
- **Apriori Algorithm Engine**: Uses `mlxtend` to find frequent itemsets and association rules.
- **Adjustable Parameters**: Set Minimum Support, Minimum Confidence, and Maximum Rules.
- **Data Visualization**: Scatter plots (Support vs Confidence) and Bar charts (Top Rules by Lift) using Chart.js.
- **Multilingual Support**: Switch seamlessly between Uzbek, English, and Russian.
- **Modern UI**: Fully responsive, glassmorphism design with neon accents and smooth animations.
- **Export**: Export generated rules to CSV.

## Technology Stack
- **Backend**: Python 3, Flask, pandas, mlxtend, numpy
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Chart.js, FontAwesome

## Project Structure
```
project/
│
├── app.py                  # Main Flask server
├── requirements.txt        # Python dependencies
├── README.md               # Documentation
│
├── static/
│   ├── css/
│   │   └── style.css       # Glassmorphism styling
│   │
│   ├── js/
│   │   └── app.js          # Frontend logic (Charts, API, Upload)
│   │
│   └── uploads/            # Temporary CSV uploads directory
│
├── templates/
│   └── index.html          # Main application dashboard
│
├── utils/
│   └── apriori_engine.py   # Apriori logic using mlxtend
│
└── languages/              # Localization JSON files
    ├── uz.json
    ├── en.json
    └── ru.json
```

## Setup Instructions

1. **Clone or Download the Project**
2. **Open a Terminal** and navigate to the project directory.
3. **Create a Virtual Environment** (Optional but recommended):
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```
4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
5. **Run the Application**:
   ```bash
   python app.py
   ```
6. **Open in Browser**:
   Navigate to `http://127.0.0.1:5000`

## How to Format Your Dataset
The platform accepts CSV files. It is optimized for transactional datasets where each row is a transaction, and the non-empty cells in the row represent the items bought in that transaction.
Alternatively, one-hot encoded datasets (where columns are items and values are 0/1, True/False) are also supported.

Enjoy mining your data!
