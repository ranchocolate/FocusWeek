
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const defaultTags = ["Deep Work", "Maintenance", "Admin", "Growth", "Strategy"];
const weeksContainer = document.getElementById('weeksContainer');
const weekRange = document.getElementById('currentWeekStart');

let tags = JSON.parse(localStorage.getItem('tags')) || [...defaultTags];
let tasks = JSON.parse(localStorage.getItem('tasks')) || {};
let defaultSlots = parseInt(localStorage.getItem('defaultSlots')) || 3;
let currentWeekOffset = 0; // 0 = this week, 1 = next, -1 = previous

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekStart(offset) {
  const today = new Date();
  const first = startOfWeek(new Date(today.setDate(today.getDate() + offset * 7)));
  return first;
}

function getWeekKey(date) {
  return date.toISOString().split('T')[0];
}

function saveData() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('tags', JSON.stringify(tags));
  localStorage.setItem('defaultSlots', defaultSlots);
}

function clearData(selected) {
  if (selected.tasks) tasks = {};
  if (selected.tags) tags = [...defaultTags];
  if (selected.weeks) currentWeekOffset = 0;
  saveData();
  render();
}

function renderTags() {
  const tagList = document.getElementById('tagList');
  tagList.innerHTML = '';
  tags.forEach((tag, idx) => {
    const tagEl = document.createElement('span');
    tagEl.className = 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1 rounded cursor-pointer';
    tagEl.textContent = tag;
    tagEl.onclick = () => {
      const newTag = prompt('Edit tag:', tag);
      if (newTag) {
        tags[idx] = newTag.trim();
        saveData();
        renderTags();
      }
    };
    tagList.appendChild(tagEl);
  });
}

function renderWeeks() {
  weeksContainer.innerHTML = '';
  weeksContainer.style.transform = `translateX(0px)`;

  for (let i = 0; i < 6; i++) {
    const weekOffset = currentWeekOffset + i;
    const weekStart = getWeekStart(weekOffset);
    const weekKey = getWeekKey(weekStart);

    const weekDiv = document.createElement('div');
    weekDiv.className = 'min-w-full flex flex-col gap-4 p-4';

    daysOfWeek.forEach(day => {
      const dayKey = `${weekKey}-${day}`;
      const dayTasks = tasks[dayKey] || [];

      const dayDiv = document.createElement('div');
      dayDiv.className = 'border p-2 rounded';

      const dayHeader = document.createElement('h3');
      dayHeader.className = 'font-bold mb-2';
      dayHeader.textContent = `${day}`;
      dayDiv.appendChild(dayHeader);

      const taskList = document.createElement('div');
      dayTasks.forEach((task, idx) => {
        taskList.appendChild(createTaskElement(dayKey, idx, task));
      });

      dayDiv.appendChild(taskList);

      const addBtn = document.createElement('button');
      addBtn.textContent = '+ Add Task';
      addBtn.className = 'mt-2 text-blue-500 hover:underline';
      addBtn.onclick = () => {
        const newTask = { text: '', tags: [], completed: false };
        tasks[dayKey] = tasks[dayKey] || [];
        tasks[dayKey].push(newTask);
        saveData();
        render();
      };
      dayDiv.appendChild(addBtn);

      weekDiv.appendChild(dayDiv);
    });

    weeksContainer.appendChild(weekDiv);
  }

  weekRange.textContent = getWeekStart(currentWeekOffset).toLocaleDateString();
}

function createTaskElement(dayKey, idx, task) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center gap-2 mb-2';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.onchange = () => {
    task.completed = checkbox.checked;
    saveData();
    render();
  };

  const textInput = document.createElement('input');
  textInput.value = task.text;
  textInput.placeholder = 'Task description';
  textInput.className = `border flex-1 p-1 rounded ${task.completed ? 'completed' : ''}`;
  textInput.oninput = (e) => {
    task.text = e.target.value;
    saveData();
  };

  const tagSelect = document.createElement('select');
  tagSelect.className = 'border p-1 rounded';
  tagSelect.innerHTML = `<option value="">Tag</option>` + tags.map(t => `<option value="${t}" ${task.tags.includes(t) ? 'selected' : ''}>${t}</option>`).join('');
  tagSelect.onchange = (e) => {
    const selected = e.target.value;
    if (selected && !task.tags.includes(selected)) {
      task.tags.push(selected);
      saveData();
      render();
    }
  };

  wrapper.appendChild(checkbox);
  wrapper.appendChild(textInput);
  wrapper.appendChild(tagSelect);

  return wrapper;
}

function searchTasks(query) {
  const lowerQuery = query.toLowerCase();
  const allTasks = document.querySelectorAll('#weeksContainer input[type="text"]');

  allTasks.forEach(input => {
    const parentDiv = input.closest('div.border');
    if (!query) {
      parentDiv.classList.remove('hidden');
    } else {
      const matchesText = input.value.toLowerCase().includes(lowerQuery);
      const matchesTag = input.parentElement.querySelector('select')?.value.toLowerCase().includes(lowerQuery);
      if (matchesText || matchesTag) {
        parentDiv.classList.remove('hidden');
      } else {
        parentDiv.classList.add('hidden');
      }
    }
  });
}

function render() {
  renderWeeks();
  renderTags();
}

// Navigation
document.getElementById('prevWeeks').onclick = () => {
  currentWeekOffset -= 6;
  weeksContainer.style.transform = `translateX(-100%)`;
  setTimeout(render, 400);
};

document.getElementById('nextWeeks').onclick = () => {
  currentWeekOffset += 6;
  weeksContainer.style.transform = `translateX(100%)`;
  setTimeout(render, 400);
};

// Search
document.getElementById('searchInput').oninput = (e) => {
  searchTasks(e.target.value);
};

// Tag Management
document.getElementById('addTagBtn').onclick = () => {
  const newTag = document.getElementById('newTagInput').value.trim();
  if (newTag && !tags.includes(newTag)) {
    tags.push(newTag);
    document.getElementById('newTagInput').value = '';
    saveData();
    renderTags();
  }
};

// Theme toggle
document.getElementById('toggleTheme').onclick = () => {
  document.documentElement.classList.toggle('dark');
};

// Settings Modal
const settingsModal = document.getElementById('settingsModal');
document.getElementById('settingsBtn').onclick = () => {
  document.getElementById('defaultSlotsInput').value = defaultSlots;
  settingsModal.classList.remove('hidden');
};
document.getElementById('closeSettingsBtn').onclick = () => {
  settingsModal.classList.add('hidden');
};
document.getElementById('applySettingsBtn').onclick = () => {
  defaultSlots = parseInt(document.getElementById('defaultSlotsInput').value) || 3;
  saveData();
  settingsModal.classList.add('hidden');
  render();
};
document.getElementById('resetBtn').onclick = () => {
  const selected = {
    tasks: document.getElementById('resetTasks').checked,
    tags: document.getElementById('resetTags').checked,
    weeks: document.getElementById('resetWeeks').checked,
  };
  clearData(selected);
  settingsModal.classList.add('hidden');
};

render();
