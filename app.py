from flask import Flask, jsonify, request, send_from_directory
from todo_manager import TodoManager
from flask_cors import CORS
import os
from datetime import datetime, timedelta

app = Flask(__name__, static_folder='.')
CORS(app)  # Allow cross domain requests

todo_manager = TodoManager()

# Add front-end web page routing
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Add static files routing
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/api/todos/<date_str>', methods=['GET'])
def get_todos(date_str):
    """Get the to-do list for the specified date"""
    todos = todo_manager.get_todos(date_str)
    return jsonify(todos)

@app.route('/api/dates-with-todos', methods=['GET'])
def get_dates_with_todos():
    """Get all dates with to-do events"""
    dates = list(todo_manager.todos.keys())
    return jsonify(dates)

@app.route('/api/todos/<date_str>', methods=['POST'])
def add_todo(date_str):
    """Add new to-do"""
    data = request.json
    todo = todo_manager.add_todo(
        date_str,
        data['content'],
        data.get('event_type', 'meeting')
    )
    return jsonify(todo)

@app.route('/api/todos/<date_str>/<int:todo_id>', methods=['DELETE'])
def delete_todo(date_str, todo_id):
    success = todo_manager.delete_todo(date_str, todo_id)
    return jsonify({'success': success})

@app.route('/api/todos/<date_str>/<int:todo_id>/complete', methods=['PUT'])
def mark_completed(date_str, todo_id):
    success = todo_manager.mark_completed(date_str, todo_id)
    return jsonify({'success': success})

@app.route('/api/todos/<date_str>/<int:todo_id>/update', methods=['PUT'])
def update_todo(date_str, todo_id):
    """Update to-do"""
    data = request.json
    success = todo_manager.update_todo(date_str, todo_id, data)
    return jsonify({'success': success})

@app.route('/api/date-range', methods=['GET'])
def get_date_range():
    today = datetime.now()
    start_date = today - timedelta(days=15)
    end_date = today + timedelta(days=15)
    
    date_range = {
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
        'today': today.strftime('%Y-%m-%d')
    }
    
    return jsonify(date_range)

@app.route('/api/todos/clear-all', methods=['DELETE'])
def clear_all_todos():
    """Clear all history data"""
    todo_manager.clear_all()
    return jsonify({'success': True})

@app.route('/api/todos/review', methods=['GET'])
def get_todos_review():
    """Obtain event statistics data for the past 15 days"""
    review_data = todo_manager.generate_review()
    return jsonify(review_data)

if __name__ == '__main__':
    # Check if there is existing data, if not, add sample examples
    if not todo_manager.todos:
        # Priority 1
        todo_manager.add_todo('September 1, 2025', 'Product Launch Meeting', 'priority1')
        todo_manager.add_todo('September 3, 2025', 'Interview at 9 a.m.', 'priority1')
        todo_manager.add_todo('August 15, 2025', 'FA Exam at Hall1 at 9 a.m.', 'priority1')
        todo_manager.add_todo('September 13, 2025', 'City Marathon', 'priority1')

        # Priority 2
        todo_manager.add_todo('September 4, 2025', 'Morning Run 5KM', 'priority2')
        todo_manager.add_todo('September 14, 2025', 'Yoga at 1p.m.', 'priority2')
        todo_manager.add_todo('July 16, 2025', 'Oral practice1h', 'priority2')
        todo_manager.add_todo('September 13, 2025', 'Booking hotel in Barcelona', 'priority2')

        # Priority 3
        todo_manager.add_todo('September 14, 2025', 'chat with new neighbors', 'priority3')
        todo_manager.add_todo('September 1, 2025', 'Car cleaning', 'priority3')
        todo_manager.add_todo('September 17, 2025', 'Coffee machine maintenance', 'priority3')
        todo_manager.add_todo('September 18, 2025', 'Farewell Party', 'priority3')

        # Priority 4
        todo_manager.add_todo('August 15, 2025', 'Shopping for a skirt', 'priority4')
        todo_manager.add_todo('July 16, 2025', 'Game Star', 'priority4')
        todo_manager.add_todo('September 14, 2025', 'Rednotebook Browsing', 'priority4')
        todo_manager.add_todo('September 5, 2025', 'MineCraft', 'priority4')
        

    app.run(debug=True, port=5000) 