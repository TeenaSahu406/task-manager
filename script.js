document.addEventListener('DOMContentLoaded', function() {
    // Create stars background
    createStars();
    
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const priorityOptions = document.querySelectorAll('.priority-option');
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const pendingTasksEl = document.getElementById('pendingTasks');
    
    // Load tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('cosmicTasks')) || [];
    let currentFilter = 'all';
    let currentPriority = 'low';
    let dragSrcEl = null;
    
    // Initialize the app
    renderTasks();
    updateStats();
    
    // Event Listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active filter button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Set current filter and re-render
            currentFilter = this.getAttribute('data-filter');
            renderTasks();
        });
    });
    
    priorityOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Update active priority option
            priorityOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            
            // Set current priority
            currentPriority = this.getAttribute('data-priority');
        });
    });
    
    // Functions
    function createStars() {
        const starsContainer = document.getElementById('stars');
        const starCount = 150;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            
            // Random position and size
            const size = Math.random() * 3;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            
            // Random animation delay
            star.style.animationDelay = `${Math.random() * 5}s`;
            
            starsContainer.appendChild(star);
        }
    }
    
    function addTask() {
        const taskText = taskInput.value.trim();
        
        if (taskText === '') {
            showNotification('Please enter a task!', 'error');
            return;
        }
        
        // Create new task object
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: currentPriority,
            createdAt: new Date().toISOString()
        };
        
        // Add to tasks array
        tasks.push(newTask);
        
        // Save to localStorage
        saveTasks();
        
        // Clear input and re-render
        taskInput.value = '';
        renderTasks();
        updateStats();
        
        showNotification('Task added successfully!', 'success');
    }
    
    function toggleTask(id) {
        // Find task and toggle completed status
        const taskIndex = tasks.findIndex(task => task.id === id);
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        
        saveTasks();
        renderTasks();
        updateStats();
        
        // Show confetti if task was completed
        if (tasks[taskIndex].completed) {
            createConfetti();
            showNotification('Task completed! Great job!', 'success');
        }
    }
    
    function deleteTask(id) {
        // Remove task from array
        tasks = tasks.filter(task => task.id !== id);
        
        saveTasks();
        renderTasks();
        updateStats();
        
        showNotification('Task deleted!', 'info');
    }
    
    function editTask(id, newText) {
        if (newText.trim() === '') {
            deleteTask(id);
            return;
        }
        
        // Update task text
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, text: newText.trim() };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
    }
    
    function saveTasks() {
        localStorage.setItem('cosmicTasks', JSON.stringify(tasks));
    }
    
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
    }
    
    function renderTasks() {
        // Clear the task list
        taskList.innerHTML = '';
        
        // Filter tasks based on current filter
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        } else if (currentFilter === 'high') {
            filteredTasks = tasks.filter(task => task.priority === 'high');
        }
        
        // Show/hide empty state
        if (filteredTasks.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
        
        // Sort tasks by priority (high first) and completion status
        filteredTasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        
        // Render each task
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.draggable = true;
            taskItem.setAttribute('data-id', task.id);
            
            const priorityClass = `priority-${task.priority}`;
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <span class="task-priority ${priorityClass}">${task.priority}</span>
                <div class="task-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Add event listeners
            const checkbox = taskItem.querySelector('.task-checkbox');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            const editBtn = taskItem.querySelector('.edit-btn');
            const taskText = taskItem.querySelector('.task-text');
            
            checkbox.addEventListener('change', () => toggleTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            // Edit button click
            editBtn.addEventListener('click', () => {
                const currentText = taskText.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                input.className = 'edit-input';
                
                // Replace text with input
                taskText.replaceWith(input);
                input.focus();
                
                // Save on Enter or blur
                const saveEdit = () => {
                    editTask(task.id, input.value);
                };
                
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit();
                    }
                });
                
                input.addEventListener('blur', saveEdit);
            });
            
            // Double-click to edit
            taskText.addEventListener('dblclick', () => {
                const currentText = taskText.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                input.className = 'edit-input';
                
                // Replace text with input
                taskText.replaceWith(input);
                input.focus();
                
                // Save on Enter or blur
                const saveEdit = () => {
                    editTask(task.id, input.value);
                };
                
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit();
                    }
                });
                
                input.addEventListener('blur', saveEdit);
            });
            
            // Drag and drop functionality
            taskItem.addEventListener('dragstart', handleDragStart);
            taskItem.addEventListener('dragover', handleDragOver);
            taskItem.addEventListener('dragenter', handleDragEnter);
            taskItem.addEventListener('dragleave', handleDragLeave);
            taskItem.addEventListener('drop', handleDrop);
            taskItem.addEventListener('dragend', handleDragEnd);
            
            taskList.appendChild(taskItem);
        });
    }
    
    // Drag and Drop Functions
    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        this.classList.add('dragging');
    }
    
    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    function handleDragEnter(e) {
        this.classList.add('over');
    }
    
    function handleDragLeave(e) {
        this.classList.remove('over');
    }
    
    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        if (dragSrcEl !== this) {
            // Get task IDs
            const dragId = parseInt(dragSrcEl.getAttribute('data-id'));
            const dropId = parseInt(this.getAttribute('data-id'));
            
            // Find indices in tasks array
            const dragIndex = tasks.findIndex(task => task.id === dragId);
            const dropIndex = tasks.findIndex(task => task.id === dropId);
            
            // Reorder tasks array
            const [draggedTask] = tasks.splice(dragIndex, 1);
            tasks.splice(dropIndex, 0, draggedTask);
            
            saveTasks();
            renderTasks();
        }
        
        return false;
    }
    
    function handleDragEnd(e) {
        document.querySelectorAll('.task-item').forEach(item => {
            item.classList.remove('over');
            item.classList.remove('dragging');
        });
    }
    
    function createConfetti() {
        const confettiCount = 100;
        const colors = ['#6c63ff', '#ff6584', '#36d1dc', '#ffc107', '#ffffff'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            
            // Random properties
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5;
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 3 + 2;
            
            confetti.style.backgroundColor = color;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.left = `${left}%`;
            confetti.style.top = '-10px';
            confetti.style.opacity = '1';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            
            // Animation
            confetti.style.transition = `all ${animationDuration}s ease-out`;
            
            document.body.appendChild(confetti);
            
            // Animate
            setTimeout(() => {
                confetti.style.transform = `translateY(${window.innerHeight}px) rotate(${Math.random() * 720}deg)`;
                confetti.style.opacity = '0';
            }, 10);
            
            // Remove after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    document.body.removeChild(confetti);
                }
            }, animationDuration * 1000);
        }
    }
    
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '5px';
        notification.style.color = 'white';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        
        // Set background color based on type
        if (type === 'success') {
            notification.style.backgroundColor = '#4caf50';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#f44336';
        } else {
            notification.style.backgroundColor = '#2196f3';
        }
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
});