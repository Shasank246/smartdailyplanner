class TaskPlanner {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.schedule = [];
        this.initializeElements();
        this.attachEventListeners();
        this.renderTasks();
        this.setDefaultDate();
    }

    initializeElements() {
        this.taskForm = document.getElementById('taskForm');
        this.taskList = document.getElementById('taskList');
        this.scheduleDate = document.getElementById('scheduleDate');
        this.scheduleDisplay = document.getElementById('scheduleDisplay');
        this.generateScheduleBtn = document.getElementById('generateSchedule');
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        this.scheduleDate.value = today;
    }

    attachEventListeners() {
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        this.generateScheduleBtn.addEventListener('click', () => this.generateSchedule());
    }

    addTask() {
        const task = {
            id: Date.now(),
            name: document.getElementById('taskName').value,
            duration: parseInt(document.getElementById('taskDuration').value),
            priority: document.getElementById('taskPriority').value,
            preferredTime: document.getElementById('preferredTime').value
        };

        this.tasks.push(task);
        this.saveToLocalStorage();
        this.renderTasks();
        this.taskForm.reset();
        this.showNotification('Task added successfully');
    }

    renderTasks() {
        this.taskList.innerHTML = '';
        
        const sortedTasks = [...this.tasks].sort((a, b) => {
            const priorityOrder = { urgent: 1, important: 2, normal: 3, flexible: 4 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.taskList.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item ${task.priority}`;
        
        const timePreference = task.preferredTime ? 
            `${task.preferredTime.charAt(0).toUpperCase() + task.preferredTime.slice(1)}` : 
            'No preference';

        div.innerHTML = `
            <div class="task-info">
                <h3>${task.name}</h3>
                <div class="task-meta">
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                    <span>${task.duration} minutes</span>
                    <span>${timePreference}</span>
                </div>
            </div>
            <button onclick="planner.deleteTask(${task.id})" class="btn">Delete</button>
        `;
        return div;
    }

    generateSchedule() {
        if (this.tasks.length === 0) {
            this.showNotification('Please add tasks first', 'error');
            return;
        }

        const timeSlots = {
            morning: { start: 540, end: 720 },    // 9:00 - 12:00
            afternoon: { start: 720, end: 1020 }, // 12:00 - 17:00
            evening: { start: 1020, end: 1200 }   // 17:00 - 20:00
        };

        this.schedule = this.optimizeSchedule(this.tasks, timeSlots);
        this.renderSchedule();
    }

    optimizeSchedule(tasks, timeSlots) {
        const schedule = [];
        const sortedTasks = [...tasks].sort((a, b) => {
            const priorityScores = { urgent: 4, important: 3, normal: 2, flexible: 1 };
            return priorityScores[b.priority] - priorityScores[a.priority];
        });

        sortedTasks.forEach(task => {
            if (task.preferredTime) {
                const slot = timeSlots[task.preferredTime];
                if (this.findTimeSlot(schedule, task, slot.start, slot.end)) {
                    return;
                }
            }
            
            // If preferred time not available, try all time slots
            for (const slot of Object.values(timeSlots)) {
                if (this.findTimeSlot(schedule, task, slot.start, slot.end)) {
                    break;
                }
            }
        });

        return schedule.sort((a, b) => a.startTime - b.startTime);
    }

    findTimeSlot(schedule, task, startTime, endTime) {
        let currentTime = startTime;
        while (currentTime + task.duration <= endTime) {
            const conflict = schedule.some(scheduledTask => {
                return (currentTime < scheduledTask.endTime && 
                        currentTime + task.duration > scheduledTask.startTime);
            });

            if (!conflict) {
                schedule.push({
                    ...task,
                    startTime: currentTime,
                    endTime: currentTime + task.duration
                });
                return true;
            }
            currentTime += 15; // 15-minute intervals
        }
        return false;
    }

    renderSchedule() {
        if (this.schedule.length === 0) {
            this.scheduleDisplay.innerHTML = '<p>No tasks scheduled</p>';
            return;
        }

        const scheduleHTML = this.schedule.map(task => `
            <div class="schedule-slot ${task.priority}">
                <div class="task-info">
                    <h3>${task.name}</h3>
                    <div class="task-meta">
                        <span>${this.formatTime(task.startTime)} - ${this.formatTime(task.endTime)}</span>
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                        <span>${task.duration} minutes</span>
                    </div>
                </div>
            </div>
        `).join('');

        this.scheduleDisplay.innerHTML = scheduleHTML;
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveToLocalStorage();
        this.renderTasks();
        this.showNotification('Task deleted');
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.querySelector('.message').textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'flex';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

const planner = new TaskPlanner();