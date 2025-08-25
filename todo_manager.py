import json
from datetime import datetime, timedelta
import os

class TodoManager:
    # Define event types and priorities
    EVENT_TYPES = {
        'priority1': {'priority': 1, 'color': '#ff4757', 'icon': '🔴', 'name': 'Priority1'},
        'priority2': {'priority': 2, 'color': '#ffa502', 'icon': '🟠', 'name': 'Priority2'},
        'priority3': {'priority': 3, 'color': '#1e90ff', 'icon': '🔵', 'name': 'Priority3'},
        'priority4': {'priority': 4, 'color': '#2ed573', 'icon': '🟢', 'name': 'Priority4'}
    }

    def __init__(self, file_path='todos.json'):
        self.file_path = file_path
        self.todos = self._load_todos()
        # Update the format of existing data during initialization
        self._update_existing_todos()

    def _update_existing_todos(self):
        """Update the format of existing to-do events"""
        for date_str in self.todos:
            for todo in self.todos[date_str]:
                if 'event_type' not in todo:
                    # Default event type
                    todo['event_type'] = 'priority4'
                    event_info = self.EVENT_TYPES['priority4']
                    todo.update({
                        'priority': event_info['priority'],
                        'color': event_info['color'],
                        'icon': event_info['icon']
                    })
                # Convert meeting type to priority4 type
                # (deleted past trial)
                elif todo['event_type'] == 'meeting':
                    todo['event_type'] = 'priority4'
                    event_info = self.EVENT_TYPES['priority4']
                    todo.update({
                        'priority': event_info['priority'],
                        'color': event_info['color'],
                        'icon': event_info['icon']
                    })
        # Save updated data
        self._save_todos()

    def _load_todos(self):
        """Load to-do list from file"""
        if os.path.exists(self.file_path):
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

    def _save_todos(self):
        """Save to-do list to file"""
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(self.todos, f, ensure_ascii=False, indent=2)

    def add_todo(self, date_str, todo_item, event_type='priority4'):
        """Add to-do list item

        Args:
            date_str: Date string, format as 'Month DD, YYYY'
            todo_item: to-do list events
            event_type: event type (priority1/priority2/priority3/priority4)
        """
        # Convert date format to ISO format
        date_obj = datetime.strptime(date_str, '%B %d, %Y')
        iso_date = date_obj.strftime('%Y-%m-%d')
        
        if iso_date not in self.todos:
            self.todos[iso_date] = []
        
        event_info = self.EVENT_TYPES.get(event_type, self.EVENT_TYPES['priority4'])
        
        new_todo = {
            'id': len(self.todos[iso_date]),
            'content': todo_item,
            'completed': False,
            'created_at': datetime.now().isoformat(),
            'event_type': event_type,
            'priority': event_info['priority'],
            'color': event_info['color'],
            'icon': event_info['icon']
        }
        
        self.todos[iso_date].append(new_todo)
        self.todos[iso_date].sort(key=lambda x: x['priority'])
        self._save_todos()
        return new_todo

    def get_todos(self, date_str):
        """Get to-do items for a specified date"""
        return self.todos.get(date_str, [])

    def mark_completed(self, date_str, todo_id):
        """Mark event as completed"""
        if date_str in self.todos:
            for todo in self.todos[date_str]:
                if todo['id'] == todo_id:
                    todo['completed'] = not todo['completed']
                    self._save_todos()
                    return True
        return False

    def delete_todo(self, date_str, todo_id):
        """Delete event"""
        if date_str in self.todos:
            self.todos[date_str] = [
                todo for todo in self.todos[date_str] 
                if todo['id'] != todo_id
            ]
            self._save_todos()
            return True
        return False

    def clear_all(self):
        """Clear all records"""
        self.todos = {}
        self._save_todos()
        
    def generate_review(self):
        """Generate event statistics data for the past 15 days"""
        today = datetime.now()
        start_date = today - timedelta(days=15)


        total_todos = 0
        completed_todos = 0
        # Classify and statistically analyze by event type
        event_type_stats = {
            'priority1': {'total': 0, 'completed': 0, 'uncompleted': 0},
            'priority2': {'total': 0, 'completed': 0, 'uncompleted': 0},
            'priority3': {'total': 0, 'completed': 0, 'uncompleted': 0},
            'priority4': {'total': 0, 'completed': 0, 'uncompleted': 0},
        }
        

        for date_str in self.todos:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            
            # Traverse the data of the past 15 days
            if start_date <= date_obj <= today:
                for todo in self.todos[date_str]:
                    total_todos += 1
                    event_type = todo.get('event_type', 'priority4')
                    
                    # Dynamically add undefined event types
                    if event_type not in event_type_stats:
                        event_type_stats[event_type] = {'total': 0, 'completed': 0, 'uncompleted': 0}
                    
                    event_type_stats[event_type]['total'] += 1
                    
                    if todo.get('completed', False):
                        completed_todos += 1
                        event_type_stats[event_type]['completed'] += 1
                    else:
                        event_type_stats[event_type]['uncompleted'] += 1
        
        # 1.Overall completion rate
        completion_rate = (completed_todos / total_todos * 100) if total_todos > 0 else 0
        
        # 2.Calculate the completion rate of various types of events
        for event_type in event_type_stats:
            total = event_type_stats[event_type]['total']
            if total > 0:
                # Calculate each type complete rate
                event_type_stats[event_type]['completion_rate'] = round(event_type_stats[event_type]['completed'] / total * 100, 2)
                # Calculate each type uncomplete rate
                event_type_stats[event_type]['uncompleted_rate'] = round(event_type_stats[event_type]['uncompleted'] / total * 100, 2)
            else:
                event_type_stats[event_type]['completion_rate'] = 0
                event_type_stats[event_type]['uncompleted_rate'] = 0

            if event_type in self.EVENT_TYPES:
                event_type_stats[event_type]['name'] = self.EVENT_TYPES[event_type]['name']
                # Add priority for sorting
                event_type_stats[event_type]['priority'] = self.EVENT_TYPES[event_type]['priority']
        
        # 3.Identify event types with an uncomplete rate exceeding 60%
        uncompleted_types = []
        for event_type, stats in event_type_stats.items():
            if stats['total'] > 0 and stats['uncompleted_rate'] >= 60:
                uncompleted_types.append((event_type, stats))
        
        # Sort by uncomplete rate from high to low,
        # and if the uncomplete rate is the same, sort by priority
        uncompleted_types.sort(key=lambda x: (-x[1]['uncompleted_rate'], x[1]['priority']))
        
        high_frequency_uncompleted = []
        for event_type, stats in uncompleted_types:
            high_frequency_uncompleted.append({
                'type': event_type,
                'name': stats.get('name', event_type),
                'uncompleted_count': stats['uncompleted'],
                'total': stats['total'],
                'completion_rate': stats['completion_rate'],
                'uncompleted_rate': stats['uncompleted_rate']
            })
        
        return {
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': today.strftime('%Y-%m-%d')
            },
            'total_todos': total_todos,
            'completed_todos': completed_todos,
            'completion_rate': round(completion_rate, 2),
            'event_type_stats': event_type_stats,
            'high_frequency_uncompleted': high_frequency_uncompleted
        }

    def update_todo(self, date_str, todo_id, data):
        """Update to-do item"""
        if date_str in self.todos:
            for todo in self.todos[date_str]:
                if todo['id'] == todo_id:
                    if 'content' in data:
                        todo['content'] = data['content']

                    if 'event_type' in data:
                        event_type = data['event_type']
                        if event_type in self.EVENT_TYPES:
                            todo['event_type'] = event_type
                            event_info = self.EVENT_TYPES[event_type]
                            todo.update({
                                'priority': event_info['priority'],
                                'color': event_info['color'],
                                'icon': event_info['icon']
                            })
                    
                    # new sorting
                    self.todos[date_str].sort(key=lambda x: x['priority'])
                    self._save_todos()
                    return True
        return False

# test
if __name__ == "__main__":
    todo_manager = TodoManager()
    
    # add events
    todo_manager.add_todo('June 14, 2025', 'Product Launch Meeting', 'priority1')
    todo_manager.add_todo('June 14, 2025', 'Client Presentation', 'priority2')
    # load events
    todos = todo_manager.get_todos('2025-06-14')
    print(f"The schedule of June 14, 2025：")
    for todo in todos:
        print(f"- {todo['content']}")
    
    # mark events
    todo_manager.mark_completed('2025-06-14', 0)
    # delete events
    todo_manager.delete_todo('2025-06-14', 1)
    # reload new events
    todos = todo_manager.get_todos('2025-06-14')
    print(f"The final schedule of June 14, 2025：")
    for todo in todos:
        print(f"- {todo['content']}")