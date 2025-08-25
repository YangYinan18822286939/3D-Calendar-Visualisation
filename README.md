#Instructions for setting up and running this project
##1. Overall architecture description
This project uses Python (Flask framework) to build back-end services, and the front-end interface is implemented based on HTML. Meanwhile, all data interaction and storage are implemented through the Flask interface and the todos.json file.

The following technologies jointly implement the deployment of this project in a local development environment for front-end and back-end collaborative work.

(1) **app. py:** Built a back-end service based on the Flask framework. It implements cross-domain request support and defines multiple routes to handle front-end requests -- running this Flask application, listening to front-end requests, and performing data read and write operations with the database file todos.json, providing reliable data support for the front-end.

(2) **index.html:** Define the basic structure of the front-end page.

(3) **styles. css:** Design the style of the 3D calendar visualisation interface.

(4) **script.js:** Responsible for the dynamic construction and interactive logics of 3D calendars.

(5) **todo_manager.py:** Define the TodoManager class to manage to-do events (encapsulation of event data management functions).

(6) **todos.json:** Store to-do data in JSON format.
##2. Environmental preparation
###(1) Basic dependencies
Ensure that the following necessary environments are installed locally:

·Python: It is recommended to use Python 3.8 or above for running the back-end Flask service.

·Browser: A modern browser that is compatible with HTML and JavaScript, such as Microsoft Edge, Google Chrome, etc., needs to be installed to access the front-end html interface.
###(2) Import project files
Place all project files (including core files such as app.py, index.html, script.js, etc.) in the same local directory, and ensure that the file path is free of special characters to avoid running errors.
##3. Starting back-end service
Run app.py in the project directory. Seeing the 5000 port (default) running locally indicates that the back-end service has been started, and the web page can be accessed through the address.
##4. Accessing the front-end interface
After clicking on this address to access the service, it will automatically redirect to the front-end web page. Importantly, pay attention to keeping the back-end Flask service the running state. Open the installed browser to enable data interaction with the back-end service.
##5. User operation guides 
(1) Users enter this 3D calendar system and read the brief description and today's date prompt of the 3D calendar tool.

(2) Users can scroll the mouse to view different date cards and their to-do events.

(3) On the left side of the calendar interface, by clicking on the "navigation bar" of today's date with the mouse, users can quickly jump back to view today's calendar card at any time.

(4) For each calendar card, users can add to-do events by right-clicking (entering event content and priority type).

(5) For each event, users can perform specific actions by right-clicking: marking the completion status of the event, modifying the priority type of the event, or deleting the event.

(6) By clicking the "Efficiency Analysis" button, users can review the completion status of events in the past 15 days (such as the overall completion rate of to-do events, the completion status of each event priority, and the types of high-frequency unfinished events).

(7) By clicking the "Clear All History" button in the bottom right corner of the calendar interface, users can instantly clear all historical data in the calendar tool.