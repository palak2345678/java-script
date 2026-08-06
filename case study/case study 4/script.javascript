let taskItemsStorage = [];
let currentDisplayFilter = 'all';

function addNewTask() {
    const inputField = document.getElementById("taskInput");
    const rawText = inputField.value.trim();

    if (rawText === "") {
        alert("Action Required: Please specify a task description before submission.");
        return;
    }

    const uniqueTaskObject = {
        id: Date.now(),
        text: rawText,
        isCompleted: false
    };

    taskItemsStorage.push(uniqueTaskObject);
    inputField.value = "";
    renderTaskElementsTree();
}

function toggleTaskState(id) {
    taskItemsStorage = taskItemsStorage.map(item => {
        if (item.id === id) {
            return { ...item, isCompleted: !item.isCompleted };
        }
        return item;
    });
    renderTaskElementsTree();
}

function deleteTaskRecord(id) {
    taskItemsStorage = taskItemsStorage.filter(item => item.id !== id);
    renderTaskElementsTree();
}

function applyTaskFilter(filterMode, activeBtn) {
    currentDisplayFilter = filterMode;
    
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    activeBtn.classList.add("active");
    
    renderTaskElementsTree();
}

function renderTaskElementsTree() {
    const outputContainer = document.getElementById("taskListContainer");
    outputContainer.innerHTML = "";

    const targetedRows = taskItemsStorage.filter(item => {
        if (currentDisplayFilter === 'pending') return !item.isCompleted;
        if (currentDisplayFilter === 'completed') return item.isCompleted;
        return true;
    });

    targetedRows.forEach(item => {
        const itemLi = document.createElement("li");
        itemLi.className = `task-item ${item.isCompleted ? 'done' : ''}`;

        const textSpan = document.createElement("span");
        textSpan.className = "task-text";
        textSpan.innerText = item.text;
        textSpan.onclick = () => toggleTaskState(item.id);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.innerText = "Remove";
        deleteButton.onclick = () => deleteTaskRecord(item.id);

        itemLi.appendChild(textSpan);
        itemLi.appendChild(deleteButton);
        outputContainer.appendChild(itemLi);
    });
}

function toggleAppTheme() {
    const bodyNode = document.body;
    const actionBtn = document.getElementById("themeToggleBtn");

    if (bodyNode.classList.contains("light-theme")) {
        bodyNode.classList.replace("light-theme", "dark-theme");
        actionBtn.innerText = "Switch to Light UI";
    } else {
        bodyNode.classList.replace("dark-theme", "light-theme");
        actionBtn.innerText = "Switch to Dark UI";
    }
}
