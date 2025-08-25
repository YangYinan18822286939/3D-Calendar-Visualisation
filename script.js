document.addEventListener('DOMContentLoaded', () => {
    const arcCalendar = document.getElementById('arcCalendar');
    const totalDays = 31;
    const radius = 800; // Reduce radius
    const heightPerStep = 25; // Reduce height difference
    let isDragging = false;
    let startX = 0;
    let currentPosition = 0;
    let currentDay = new Date();
    
    // Set the current date text
    const currentDateElement = document.getElementById('current-date');
    const DAYS = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
    ];
    const MONTHS = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];
    
    // Define event types and icons
    const EVENT_TYPES = {
        'priority1': {'priority': 1, 'color': '#ff4757', 'icon': '🔴', 'name': 'Priority1'},
        'priority2': {'priority': 2, 'color': '#ffa502', 'icon': '🟠', 'name': 'Priority2'},
        'priority3': {'priority': 3, 'color': '#1e90ff', 'icon': '🔵', 'name': 'Priority3'},
        'priority4': {'priority': 4, 'color': '#2ed573', 'icon': '🟢', 'name': 'Priority3'}
    };
    
    // Right click menu (context menu) and pop-up elements
    const dateContextMenu = document.getElementById('dateContextMenu');
    const todoContextMenu = document.getElementById('todoContextMenu');
    const addTodoModal = document.getElementById('addTodoModal');
    const changeTodoTypeModal = document.getElementById('changeTodoTypeModal');
    
    // The current operation date and to-do item
    let currentContextDate = null;
    let currentContextTodo = null;

    currentDateElement.textContent = `${DAYS[currentDay.getDay()]}, ${currentDay.getDate()} ${MONTHS[currentDay.getMonth()]} ${currentDay.getFullYear()}`;

    // Click to jump to the current day directly
    document.querySelector('.welcome-line2').addEventListener('click', () => {
        const today = new Date();
        moveToDate(today);
        
        // Get the date string for the current day
        const todayStr = today.toISOString().split('T')[0];

        setTimeout(() => {
            // Find the element corresponding to the current date
            const todayItem = dateItems.find(item => 
                new Date(item.dataset.date).toISOString().split('T')[0] === todayStr
            );
            
            if (todayItem) {
                dateItems.forEach(item => {
                    item.classList.remove('active');
                });
                
                // Set the current date card as active
                todayItem.classList.add('active');
                todayItem.style.zIndex = '1000';
                
                // Load and display to-do events
                loadTodos(todayStr);
            }
        }, 850);
    });

    const dateItems = [];
    const startDate = new Date(currentDay);
    startDate.setDate(startDate.getDate() - 15);

    // Ensure date range
    const minDate = new Date(startDate);
    const maxDate = new Date(startDate);
    maxDate.setDate(startDate.getDate() + totalDays - 1);

    const fragment = document.createDocumentFragment();

    // Position calculation of 3D arc layout
    function calculatePosition(index, offset = 0) {
        // offset, an optional parameter, the dynamic scrolling offset of the mouse

        // The relative position of the current date in the total number of days(0 to 1)
        const progress = (index + offset) / totalDays;
        const angle = progress * Math.PI * 0.5; // Polar coordinate angle range limitation
        const viewHeight = window.innerHeight; // Screen visible height area

        // Set the visual center point
        const centerY = viewHeight * 0.6;
        
        // Calculate the vertical compression ratio
        const compressionRatio = Math.min(1, viewHeight / (totalDays * heightPerStep * 1.6));

        // Calculation of date card coordinate position in Cartesian Coordinate System
        return {
            // Horizontal axis
            x: -Math.cos(angle) * radius + radius,
            // Vertical axis
            y: (-progress * heightPerStep * totalDays * compressionRatio) + centerY,
            // Depth axis
            z: -Math.sin(angle) * radius,
            // Scale factor
            scale: Math.max(0.6, 1 - Math.abs(progress - 0.5) * 0.8),
            rotateX: '0deg'
        };
    }

    for (let i = 0; i < totalDays; i++) {
        const dateItem = document.createElement('div');
        // Associate predefined styles (CSS) with date cards
        dateItem.className = 'date-item';

        const itemDate = new Date(startDate);
        itemDate.setDate(startDate.getDate() + i);

        // Calculate the 3D coordinates and scaling ratio of the card
        // based on the current index i
        const pos = calculatePosition(i);

        // Then apply 3D transformation effect
        dateItem.style.transform = `
            translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)
            scale(${pos.scale})
            rotateX(0deg)
        `;
        
        // Set transparency based on distance to today card
        const distance = Math.abs(i/totalDays - 0.5) * 2;
        dateItem.style.opacity = Math.max(0.3, 1 - distance * 0.7);

        if (i > totalDays * 0.6) {
            dateItem.classList.add('far');
        } else if (i < totalDays * 0.3) {
            dateItem.classList.add('near');
        }

        // Date card information display
        dateItem.innerHTML = `
            <div class="date-layout">
                <div class="date-weekday">${DAYS[itemDate.getDay()]}</div>
                <div class="date-number">${itemDate.getDate()}</div>
            </div>
            <div class="date-info">
                ${MONTHS[itemDate.getMonth()]} ${itemDate.getFullYear()}
            </div>
            <span class="date-event-icon"></span>
            <div class="todo-list"></div>
        `;

        // Load and display the top-priority event icon immediately
        loadTopEvent(itemDate.toISOString().split('T')[0], dateItem.querySelector('.date-event-icon'));

        dateItem.dataset.date = itemDate.toISOString();
        dateItem.dataset.index = i;
        dateItems.push(dateItem);
        fragment.appendChild(dateItem);
        
        // Context menu for adding date item
        dateItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            // The context menu is only displayed when the date item is not far away
            if (!dateItem.classList.contains('far')) {
                currentContextDate = itemDate;
                // Show context menu
                showContextMenu(dateContextMenu, e.clientX, e.clientY);
            }
        });
    }

    arcCalendar.appendChild(fragment);

    // Check the number of to-do events for all dates during initialization
    initializeDateItemsBusyState();

    // Visual position adjustment
    function adjustViewPosition(currentIndex) {
        const viewHeight = window.innerHeight;
        // Prevent excessive view shift and maintain visual stability
        const viewAdjustment = Math.min(currentIndex / totalDays * 200, 150);

        arcCalendar.style.transition = 'transform 0.3s ease-out';
        arcCalendar.style.transform = `
            rotateX(-25deg)
            rotateY(15deg) 
            translateZ(100px) // Zoom in towards the front of the screen (depth axis)
            translateY(${viewAdjustment}px) // Add dynamic downward movement
        `;
    }

    // Update all cards position under the current active date card
    function updatePositions(offset) {
        const currentIndex = Math.round(-offset * totalDays);
        adjustViewPosition(currentIndex);
        
        const viewHeight = window.innerHeight;
        // Increase visible range to ensure buffer area at the edge of the screen
        const visibleRange = Math.floor(viewHeight / (heightPerStep * 0.8));
        
        dateItems.forEach((item, index) => {
            const pos = calculatePosition(index, offset);
            const distanceFromCurrent = Math.abs(index - currentIndex);
            
            // Adjust the visible range and hierarchical relationship-zIndex
            // opacity, ranging from 1 (completely opaque) to 0.4 (semi transparent)
            const isVisible = distanceFromCurrent <= visibleRange;
            if (isVisible) {
                const maxDistance = visibleRange * 0.5;
                const visibility = 1 - (distanceFromCurrent / maxDistance) * 0.6;

                // Increase the size of the current active date card and make it closer
                const baseScale = pos.scale * 0.9;
                // Add extra scaling to the current active item
                const scale = index === currentIndex ? baseScale * 1.3 : baseScale;
                const zIndex = item.classList.contains('active') ? 1000 : (totalDays - distanceFromCurrent);
                // Add Z-axis bounce for the current active item,
                // but keep X and Y positions unchanged
                const zOffset = index === currentIndex ? pos.z + 120 : pos.z;

                item.style.transform = `
                    translate3d(${pos.x}px, ${pos.y}px, ${zOffset}px)
                    scale(${scale})
                    rotateX(0deg)
                `;
                
                item.style.opacity = Math.max(0.4, visibility);
                item.style.zIndex = zIndex;
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
            
            // Update status class
            item.classList.remove('far', 'near', 'active');
            if (index === currentIndex) {
                item.classList.add('active');
            } else if (distanceFromCurrent < visibleRange * 0.3) {
                item.classList.add('near');
            } else {
                item.classList.add('far');
            }
        });
    }

    // Jump to specified date
    function moveToDate(date) {
        // Calculate the time difference between the target date and the start date
        const dayOffset = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
        const targetOffset = dayOffset / totalDays;
        
        // Add smooth transition
        dateItems.forEach(item => {
            item.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        // Move the date element to the specified location
        updatePositions(-targetOffset);
        currentPosition = -targetOffset;
        
        // Remove transition effect
        setTimeout(() => {
            dateItems.forEach(item => {
                if (!item.classList.contains('active')) {
                    item.style.transition = 'none';
                }
            });
        }, 800);
    }


    // Default scrolling interaction
    // Add wheel event listener
    arcCalendar.addEventListener('wheel', async (e) => {
        e.preventDefault(); // Prevent default behavior of scrolling wheel (page scrolling)

        const delta = e.deltaY; // Scrolling event direction
        const scrollSpeed = 0.015; // Scrolling speed

        // Scrolling position update
        const newPosition = currentPosition + (delta > 0 ? scrollSpeed : -scrollSpeed);


        // Limit scrolling range
        // to ensure that it does not exceed the boundaries of the date list
        if (newPosition <= 0 && newPosition >= -1.05) {
            // The smooth transition effect of "accelerate first, then decelerate" to the date card
            dateItems.forEach(item => {
                item.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease';
            });

            // Update all cards position under the current active date card
            updatePositions(newPosition);
            currentPosition = newPosition;

            const currentIndex = Math.round(-currentPosition * totalDays);
            const currentDateItem = dateItems[currentIndex];
            
            if (currentDateItem) {
                dateItems.forEach(item => {
                    if (item !== currentDateItem) {
                        item.classList.remove('active');
                    }
                });
                
                // Set the active status of the current active date
                currentDateItem.classList.add('active');
                currentDateItem.style.zIndex = '1000';
                
                // Load and display to-do events of the active day
                const dateStr = new Date(currentDateItem.dataset.date).toISOString().split('T')[0];
                await loadTodos(dateStr);
                
                // Update currentDay
                currentDay = new Date(currentDateItem.dataset.date);
            }
            
            // Remove transition effect after delay
            setTimeout(() => {
                dateItems.forEach(item => {
                    if (!item.classList.contains('active')) {
                        item.style.transition = 'none';
                    }
                });
            }, 400);
        }
    }, { passive: false });

    // Check the number of to-do items for the date card and update its status
    async function checkTodoCount(dateStr, dateItem) {
        try {
            const response = await fetch(`/api/todos/${dateStr}`);
            const todos = await response.json();
            
            // If the number of to-do items is greater than or equal to 3, add the busy status
            if (todos.length >= 3) {
                dateItem.classList.add('busy');
            } else {
                dateItem.classList.remove('busy');
            }
        } catch (error) {
            console.error('Failed to check todo count:', error);
        }
    }

    // Initialize the busy status of all date cards
    async function initializeDateItemsBusyState() {
        const promises = [];

        // Traverse all date cards
        for (let i = 0; i < dateItems.length; i++) {
            const dateItem = dateItems[i];
            const dateObj = new Date(dateItem.dataset.date);
            const dateStr = dateObj.toISOString().split('T')[0];
            
            // Ensure that each request is executed sequentially
            // and delayed to avoid sending a large number of requests simultaneously
            const promise = new Promise((resolve) => {
                setTimeout(async () => {
                    // Check the number of to-do items for this date card
                    await checkTodoCount(dateStr, dateItem);
                    resolve();
                }, i * 50);
            });
            
            promises.push(promise);
        }

        await Promise.all(promises);
    }

    // Load to-dos
    async function loadTodos(dateStr) {
        try {
            const response = await fetch(`/api/todos/${dateStr}`);

            const todos = await response.json();
            // Find the first element with the .active. class
            const todoList = document.querySelector('.active .todo-list');
            // Sorting logic
            if (todoList) {
                // Prioritize by priority,
                // and for those with the same priority, arrange them in chronological order of addition
                todos.sort((a, b) => {
                    if (a.priority !== b.priority) {
                        return a.priority - b.priority;
                    } else {
                        return new Date(a.created_at) - new Date(b.created_at);
                    }
                });
                // Traverse the to-do list array and generate the HTML string array
                todoList.innerHTML = todos.map(todo => `
                    <div class="todo-item todo-priority-${todo.priority} ${todo.completed ? 'completed' : ''}" 
                         data-id="${todo.id}" 
                         data-date="${dateStr}">
                        <span class="todo-icon">${todo.icon}</span>
                        <span class="todo-content">${todo.content}</span>
                    </div>
                `).join('');
                
                // Add context menu for each to-do item
                const todoItems = todoList.querySelectorAll('.todo-item');
                todoItems.forEach(item => {
                    item.addEventListener('contextmenu', function(e) {
                        e.preventDefault(); // Block the default behaviors of the browser
                        e.stopPropagation();
                        
                        // Record the current right-click to-do item information
                        currentContextTodo = {
                            id: parseInt(this.dataset.id),
                            date: this.dataset.date
                        };

                        console.log('Right-click event item:', currentContextTodo);

                        showContextMenu(todoContextMenu, e.clientX, e.clientY);
                    });
                });
                
                // Update the busy status of the current date card
                const activeItem = document.querySelector('.date-item.active');
                if (activeItem) {
                    if (todos.length >= 3) {
                        activeItem.classList.add('busy');
                    } else {
                        activeItem.classList.remove('busy');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load todos:', error);
        }
    }

    async function addTodo(dateStr, content, eventType = 'priority4') {
        try {
            const response = await fetch(`/api/todos/${dateStr}`, {
                method: 'POST',
                // Creat type
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, event_type: eventType }),
            });
            const todo = await response.json();
            // Reload to-do list
            await loadTodos(dateStr);
            const dateItem = dateItems.find(item => 
                new Date(item.dataset.date).toISOString().split('T')[0] === dateStr
            );
            // Update date card-highest priority icon
            if (dateItem) {
                loadTopEvent(dateStr, dateItem.querySelector('.date-event-icon'));
                
                // Check and update the busy status
                checkTodoCount(dateStr, dateItem);
            }
        } catch (error) {
            console.error('Failed to add todo:', error);
        }
    }

    // Load the highest priority event icon
    async function loadTopEvent(dateStr, iconElement) {
        try {
            const response = await fetch(`/api/todos/${dateStr}`);
            const todos = await response.json();
            if (todos.length > 0) {
                // Minimum priority number
                const topTodo = todos.reduce((prev, current) => 
                    (current.priority < prev.priority) ? current : prev
                );
                iconElement.textContent = topTodo.icon;
            }
        } catch (error) {
            console.error('Failed to load event icon:', error);
        }
    }
    
    // Display context menu
    function showContextMenu(menu, x, y) {
        hideAllContextMenus();
        
        // Set location and display
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.display = 'block';

        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Hide all context menus
    function hideAllContextMenus() {
        dateContextMenu.style.display = 'none';
        todoContextMenu.style.display = 'none';
    }
    
    // Click anywhere to close the context menu
    document.addEventListener('click', () => {
        hideAllContextMenus();
    });
    
    // Prevent the context menu from automatically closing
    dateContextMenu.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Block the default behaviors of the browser
        e.stopPropagation();
    });

    todoContextMenu.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Show modal
    function showModal(modal) {
        modal.classList.add('active');
    }
    
    // Hide modal
    function hideModal(modal) {
        modal.classList.remove('active');
    }
    
    // Date context menu - Add todo item
    document.getElementById('addTodoItem').addEventListener('click', () => {
        if (currentContextDate) {
            // Clear input
            document.getElementById('todoContent').value = '';
            
            // Reset event type selection
            document.querySelectorAll('#addTodoModal .event-type-option').forEach(option => {
                option.classList.remove('selected');
            });
            // Default “priority4”
            document.querySelector('#addTodoModal .event-type-option[data-type="priority4"]').classList.add('selected');
            
            // Show add todo modal
            showModal(addTodoModal);
        }
    });
    
    // Add todo modal - Cancel button
    document.getElementById('cancelAddTodo').addEventListener('click', () => {
        hideModal(addTodoModal);
    });
    
    // Add todo modal - Confirm button
    document.getElementById('confirmAddTodo').addEventListener('click', async () => {
        const content = document.getElementById('todoContent').value.trim();
        if (content && currentContextDate) {
            // Get selected event type
            const selectedType = document.querySelector('#addTodoModal .event-type-option.selected');
            const eventType = selectedType ? selectedType.dataset.type : 'priority4';
            
            // Format date
            const dateStr = `${MONTHS[currentContextDate.getMonth()]} ${currentContextDate.getDate()}, ${currentContextDate.getFullYear()}`;
            
            // Add todo item real function
            await addTodo(dateStr, content, eventType);

            const isoDateStr = currentContextDate.toISOString().split('T')[0];
            // Find and update loadTopEvent
            const dateItem = dateItems.find(item => 
                new Date(item.dataset.date).toISOString().split('T')[0] === isoDateStr
            );
            
            if (dateItem) {
                const iconElement = dateItem.querySelector('.date-event-icon');
                if (iconElement) {
                    loadTopEvent(isoDateStr, iconElement);
                }
            }
            
            hideModal(addTodoModal);
        }
    });
    
    // Event type selection
    document.querySelectorAll('.event-type-option').forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected state from sibling elements
            const parent = option.parentElement;
            parent.querySelectorAll('.event-type-option').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Set current as selected
            option.classList.add('selected');
        });
    });

    // Todo item context menu - Mark completed status
    document.getElementById('markTodoItem').addEventListener('click', async () => {
        if (currentContextTodo) {
            try {
                const response = await fetch(`/api/todos/${currentContextTodo.date}/${currentContextTodo.id}/complete`, {
                    method: 'PUT'
                });
                const result = await response.json();
                
                if (result.success) {
                    // reloadTodos
                    await loadTodos(currentContextTodo.date);

                    const dateItem = dateItems.find(item => 
                        new Date(item.dataset.date).toISOString().split('T')[0] === currentContextTodo.date
                    );
                    if (dateItem) {
                        checkTodoCount(currentContextTodo.date, dateItem);
                    }
                }
            } catch (error) {
                console.error('Failed to mark todo status:', error);
            }
        }
    });
    
    // Todo item context menu - Change event type
    document.getElementById('changeTodoType').addEventListener('click', () => {
        if (currentContextTodo) {
            document.querySelectorAll('#changeTodoTypeModal .event-type-option').forEach(option => {
                option.classList.remove('selected');
            });
            // default "priority4"
            document.querySelector('#changeTodoTypeModal .event-type-option[data-type="priority4"]').classList.add('selected');

            showModal(changeTodoTypeModal);
        }
    });
    
    // Change Todo Type modal - Cancel button
    document.getElementById('cancelChangeType').addEventListener('click', () => {
        hideModal(changeTodoTypeModal);
    });
    
    // Change Todo Type modal - Confirm button
    document.getElementById('confirmChangeType').addEventListener('click', async () => {
        if (currentContextTodo) {
            const selectedType = document.querySelector('#changeTodoTypeModal .event-type-option.selected');
            const eventType = selectedType ? selectedType.dataset.type : 'priority4';
            
            try {
                const response = await fetch(`/api/todos/${currentContextTodo.date}/${currentContextTodo.id}/update`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ event_type: eventType }),
                });
                const result = await response.json();
                
                if (result.success) {
                    // Get all to-do items and sort
                    const todosResponse = await fetch(`/api/todos/${currentContextTodo.date}`);
                    const todos = await todosResponse.json();

                    todos.sort((a, b) => {
                        if (a.priority !== b.priority) {
                            return a.priority - b.priority;
                        } else {
                            return new Date(a.created_at) - new Date(b.created_at);
                        }
                    });
                    
                    // reloadTodos
                    await loadTodos(currentContextTodo.date);
                    
                    // Update loadTopEvent
                    const dateItem = dateItems.find(item => 
                        new Date(item.dataset.date).toISOString().split('T')[0] === currentContextTodo.date
                    );
                    if (dateItem) {
                        loadTopEvent(currentContextTodo.date, dateItem.querySelector('.date-event-icon'));

                        checkTodoCount(currentContextTodo.date, dateItem);
                    }
                }
            } catch (error) {
                console.error('Failed to change event type:', error);
            }

            hideModal(changeTodoTypeModal);
        }
    });
    
    // Todo item context menu - Delete event
    document.getElementById('deleteTodoItem').addEventListener('click', async () => {
        console.log('Delete button clicked, current todo:', currentContextTodo);
        if (currentContextTodo) {
            try {
                const response = await fetch(`/api/todos/${currentContextTodo.date}/${currentContextTodo.id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                console.log('Delete result:', result);
                
                if (result.success) {
                    // Reload todos
                    await loadTodos(currentContextTodo.date);
                    
                    // Update date icon
                    const dateItem = dateItems.find(item => 
                        new Date(item.dataset.date).toISOString().split('T')[0] === currentContextTodo.date
                    );
                    if (dateItem) {
                        loadTopEvent(currentContextTodo.date, dateItem.querySelector('.date-event-icon'));

                        // Update date item busy status
                        checkTodoCount(currentContextTodo.date, dateItem);
                    }
                }
            } catch (error) {
                console.error('Failed to delete todo:', error);
            }
        }
    });
    
    // Clear all records function
    document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all records? This action cannot be undone!')) {
            try {
                const response = await fetch('/api/todos/clear-all', {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    // Reload page
                    window.location.reload();
                }
            } catch (error) {
                console.error('Failed to clear records:', error);
            }
        }
    });
    
    // Review - Display statistical data
    const reviewBtn = document.getElementById('reviewBtn');
    const reviewModal = document.getElementById('reviewModal');
    const closeReviewBtn = document.getElementById('closeReviewBtn');
    
    // Show review modal
    reviewBtn.addEventListener('click', async () => {
        try {
            // Get statistics data
            const response = await fetch('/api/todos/review');
            const reviewData = await response.json();
            
            // 1.Update overall statistics
            document.getElementById('totalTodos').textContent = reviewData.total_todos;
            document.getElementById('completedTodos').textContent = reviewData.completed_todos;
            document.getElementById('completionRate').textContent = `${reviewData.completion_rate}%`;
            
            // 2.Update event type statistics
            const eventTypeStatsContainer = document.getElementById('eventTypeStats');
            eventTypeStatsContainer.innerHTML = '';

            const eventTypeOrder = ['priority1', 'priority2', 'priority3', 'priority4'];
            
            // Display event type statistics data in a fixed order
            eventTypeOrder.forEach(eventType => {
                const stats = reviewData.event_type_stats[eventType];
                if (stats && stats.total > 0) {
                    const eventTypeRow = document.createElement('div');
                    eventTypeRow.className = 'event-type-row';
                    
                    // Get event type icon
                    const iconClass = `event-${eventType}-icon`;
                    const icon = EVENT_TYPES[eventType]?.icon || '📝';

                    // Build line HTML
                    eventTypeRow.innerHTML = `
                        <div class="event-type-name">
                            <span class="event-type-icon ${iconClass}">${icon}</span>
                            <span>${stats.name || eventType}</span>
                        </div>
                        <div class="event-type-stats">
                            <div class="event-completion-rate">${stats.completion_rate}%</div>
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${stats.completion_rate}%"></div>
                            </div>
                            <div>${stats.completed}/${stats.total}</div>
                        </div>
                    `;
                    // Add to DOM
                    eventTypeStatsContainer.appendChild(eventTypeRow);
                }
            });
            
            // 3.Update high frequency uncompleted event types
            const highFrequencyContainer = document.getElementById('highFrequencyUncompleted');
            highFrequencyContainer.innerHTML = '';

            if (reviewData.high_frequency_uncompleted.length > 0) {
                reviewData.high_frequency_uncompleted.forEach(item => {
                    const eventTypeRow = document.createElement('div');
                    eventTypeRow.className = 'event-type-row';

                    const iconClass = `event-${item.type}-icon`;
                    const icon = EVENT_TYPES[item.type]?.icon || '📝';

                    eventTypeRow.innerHTML = `
                        <div class="event-type-name">
                            <span class="event-type-icon ${iconClass}">${icon}</span>
                            <span>${item.name}</span>
                        </div>
                        <div class="event-type-stats">
                            <div>Uncompleted: ${item.uncompleted_count}/${item.total}</div>
                            <div class="event-uncompleted-rate">${item.uncompleted_rate}%</div>
                        </div>
                    `;
                    
                    highFrequencyContainer.appendChild(eventTypeRow);
                });
            } else {
                highFrequencyContainer.innerHTML = '<div class="event-type-row">Good job! No event types with uncompleted rate above 60%</div>';
            }
            
            // Show modal
            reviewModal.classList.add('active');
        } catch (error) {
            console.error('Failed to get review data:', error);
        }
    });
    
    // Close review modal
    closeReviewBtn.addEventListener('click', () => {
        reviewModal.classList.remove('active');
    });
    
    // Click outside modal to close
    reviewModal.addEventListener('click', (e) => {
        if (e.target === reviewModal) {
            reviewModal.classList.remove('active');
        }
    });
}); 