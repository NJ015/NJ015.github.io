let editId = null;
let deltask = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Ready to build your task list!');

    const nameIn = document.getElementById('name');
    const descIn = document.getElementById('desc');
    const ddIn = document.getElementById('dd');
    const addBtn = document.getElementById('addBtn');
    const confirmDelBtn = document.getElementById('delBtn')

    // add/update tasks
    addBtn.addEventListener('click', () => {
        const name = nameIn.value.trim();
        const desc = descIn.value.trim();
        const dd = ddIn.value ? ddIn.value : 0;

        if (!name) {
            showToast('Task title is required.', 'danger');
            return;
        }
        if (name.length > 100) {
            showToast("Task name is too long (max 100 characters).", "warning");
            return;
        }
        if (!desc) {
            showToast("Description is required.", "warning");
            return;
        }
        if (desc.length > 500) {
            showToast("Description is too long (max 500 characters)", "warning");
            return;
        }
        if (dd && isNaN(new Date(dd).getTime())) {
            showToast("Invalid deadline date.", "danger");
            return;
        }

        // Get all tasks
        let tasks = JSON.parse(localStorage.getItem('tasks')) ? JSON.parse(localStorage.getItem('tasks')) : [];

        if (addBtn.innerText == 'Add') {
            const task = {
                id: Date.now(),
                name,
                desc,
                dd,
                status: 0,
                createdAt: new Date().toISOString()
            };
            tasks.push(task);
        }
        else if (addBtn.innerText == "Update") {
            tasks = tasks.map(task => {
                if (task.id === editId) {
                    return {
                        ...task,
                        name: name,
                        desc: desc,
                        dd: dd,
                    };
                }
                return task;
            });
        }

        // Save to localStorage
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Render the task in the UI
        document.getElementById('taskList').innerHTML = '';
        document.getElementById('todoList').innerHTML = '';
        reloadTasks();


        nameIn.value = '';
        descIn.value = '';
        ddIn.value = '';

        document.getElementById('addBtn').innerText = 'Add';
        document.querySelector('.modal-title').innerText = 'Add Task';

        bootstrap.Modal.getInstance(document.getElementById('addTask')).hide();

        showToast("Task saved successfully", "success");

    });

    // clear modal
    const modal = document.getElementById('addTask');
    modal.addEventListener('hidden.bs.modal', () => {
        document.getElementById('name').value = '';
        document.getElementById('desc').value = '';
        document.getElementById('dd').value = '';

        const createdAtGroup = document.getElementById('createdAtGroup');
        if (createdAtGroup) {
            createdAtGroup.remove();
        }
        const createdAtLabel = document.getElementById('calabel');
        if (createdAtLabel) createdAtLabel.remove();

        document.getElementById('addBtn').innerText = 'Add';
        document.querySelector('.modal-title').innerText = 'Add Task';
    });

    // search
    const searchBar = document.getElementById('searchIn');
    searchBar.addEventListener('input', () => {
        const s = searchBar.value.toLowerCase().trim();

        if (s === '') {
            reloadTasks();

            return;
        }

        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

        const filtered = tasks.filter(task =>
            task.name.toLowerCase().includes(s) ||
            (task.desc && task.desc.toLowerCase().includes(s))
        );

        document.getElementById('taskList').innerHTML = '';
        document.getElementById('todoList').innerHTML = '';

        const filteredTodo = filtered.filter(task => task.status === 0);

        if (filtered.length === 0) {
            showEmptyMessage(document.getElementById('taskList'), 'No matching tasks found.');
        } else {
            filtered.forEach(task => renderTask(task, 'taskList'));
        }

        if (filteredTodo.length === 0) {
            showEmptyMessage(document.getElementById('todoList'), 'No matching todo tasks.');
        } else {
            filteredTodo.forEach(task => renderTask(task, 'todoList'));
        }
    });

    // sorting
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const sorting = option.dataset.sort;
            localStorage.setItem('sort', sorting);
            sortTasks(sorting);
        });
    });

    // confirm deleting a task
    confirmDelBtn.addEventListener('click', () => {
        if (deltask) {
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            tasks = tasks.filter(t => t.id !== deltask.id);
            localStorage.setItem('tasks', JSON.stringify(tasks));

            reloadTasks();


            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmDel'));
            modal.hide();

            showToast('Task deleted successfully.', 'success');
            deltask = null;
        }
    });

    // reload with sorting
    reloadTasks();

});




function renderTask(task, listId) {

    const list = document.getElementById(listId);

    let deadline = task.dd;
    if (deadline) {
        deadline = new Date(deadline);
        let dd = deadline.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) + ' at ' + deadline.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
        deadline = dd;
    }
    else {
        deadline = "---"
    }

    const createdDate = new Date(task.createdAt);
    let added = createdDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) + ' at ' + createdDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });


    // <div id="taskCard" class="card shadow-sm py-2 px-3" style="background: #d4edda;">
    //     <div id="contentDiv" class="row flex-row align-items-center text-center">
    //         <h5 class="mb-1 col-2">Title</h5>
    //         <p class="mb-1 text-muted small col-6">task descriptionnnnnnnnnnnnnnnnnnnnn</p>
    //         <p class="mb-0 text-muted small col-3">Deadline: 7/7/2025</p>
    //         <div id="actionsDiv" class="d-flex flex-column gap-2 col-1">
    //             <button class="btn btn-sm btn-outline-success">✔</button>
    //             <button class="btn btn-sm btn-outline-primary">✎</button>
    //             <button class="btn btn-sm btn-outline-danger">🗑️</button>
    //         </div>
    //     </div>
    // </div>


    // TODO: recheck responsivness
    const taskCard = document.createElement('div');
    taskCard.className = 'card shadow-sm task-swipe-wrapper';


    if (window.Hammer) {
        const hammer = new Hammer(taskCard);
        hammer.on('swipeleft', () => {
            // taskCard.classList.add('show-actions');
            content.style.transform = 'translateX(-150px)';
            setTimeout(() => {
                content.style.transform = 'translateX(0px)';
            }, 1000);
            setTimeout(() => {
                completetask(task);
            }, 300);
        });
        hammer.on('swiperight', () => {
            // taskCard.classList.remove('show-actions');
            content.style.transform = 'translateX(150px)';
            setTimeout(() => {
                content.style.transform = 'translateX(0px)';
            }, 1000);
            setTimeout(() => {
                deleteTask(task);
            }, 300);
        });
        hammer.on('tap', () => {
            content.style.transform = 'translateX(0px)';
        })


    }


    const bg = document.createElement('div');
    bg.className = 'swipe-bg';

    const left = document.createElement('div');
    const right = document.createElement('div');

    left.className = 'swipe-left';
    right.className = 'swipe-right';

    const ricon = document.createElement('i');
    const licon = document.createElement('i');

    ricon.className = 'fas fa-trash';
    licon.className = 'fas fa-check';

    left.appendChild(licon);
    right.appendChild(ricon);

    left.innerText = 'Delete';
    right.innerText = 'Complete';

    bg.appendChild(left);
    bg.appendChild(right);



    let title = task.name.slice(0,15);
    if (task.name.length>15) title += "...";

    let description = task.desc ? task.desc.slice(0, 100) : 'No description';
    if (task.desc.length > 100) description += ' ...';

    // TODO: make it more secure by using innertext instead of innerhtml

    const strike = task.status === 1 ? 'text-decoration-line-through' : '';

    const content = document.createElement('div');
    content.className = `task-content row flex-row align-items-center px-3 py-2 text-center ${strike}`;
    content.innerHTML = `
            <h5 class="col-6 col-md-2">${title}</h5>
            <p class="mb-1 text-muted col-5 text-wrap d-none d-md-block">${description}</p>
            <p class="mb-0 text-muted col-5 col-lg-4">${deadline}</p>
            `;



    content.style.backgroundColor = getTaskColor(task);
    content.style.cursor = 'pointer';

    content.addEventListener('click', () => {
        editId = task.id;
        document.getElementById('name').value = task.name;
        document.getElementById('desc').value = task.desc;
        document.getElementById('dd').value = task.dd;

        const createdAtLabel = document.createElement('label');
        createdAtLabel.id = 'calabel'
        createdAtLabel.textContent = 'Created at';
        const createdAtGrp = document.createElement('div');
        createdAtGrp.id = 'createdAtGroup';
        createdAtGrp.className = 'input-group mb-3';
        const createdAtIn = document.createElement('input');
        createdAtIn.type = 'text'
        createdAtIn.className = 'form-control';
        createdAtIn.disabled = true;
        createdAtIn.value = added;

        createdAtGrp.appendChild(createdAtIn);

        document.getElementById('addBtn').innerText = 'Update';
        document.querySelector('.modal-title').innerText = 'Edit Task';

        const modal = document.getElementById('addTask');
        const modalBody = modal.querySelector('.modal-body .container-fluid');
        modalBody.append(createdAtLabel, createdAtGrp);

        const editModel = new bootstrap.Modal(modal);

        editModel.show();
    });




    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'd-none d-lg-flex flex-column gap-2 col-1';

    const completebtn = document.createElement('button');
    completebtn.className = "btn btn-sm btn-outline-success"
    completebtn.innerHTML = '<i class="fas fa-check fa-lg"></i>'
    completebtn.addEventListener('click', (e) => {
        e.stopPropagation();
        completetask(task);
    });


    // const editbtn = document.createElement('button');
    // editbtn.className = "btn btn-sm btn-outline-primary";
    // editbtn.innerHTML = "<i class='fas fa-pen'></i>";
    // editbtn.addEventListener('click', () => {
    //     editId = task.id;
    //     document.getElementById('name').value = task.name;
    //     document.getElementById('desc').value = task.desc;
    //     document.getElementById('dd').value = task.dd;

    //     document.getElementById('addBtn').innerText = 'Update';
    //     document.querySelector('.modal-title').innerText = 'Edit Task';

    //     const editModel = new bootstrap.Modal(document.getElementById('addTask'));
    //     editModel.show();
    // });


    const deletebtn = document.createElement('button');
    deletebtn.className = 'btn btn-sm btn-outline-danger';
    deletebtn.innerHTML = '<i class="fas fa-trash-can"></i>';
    deletebtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task);
    });


    actionsDiv.appendChild(completebtn)
    actionsDiv.appendChild(deletebtn);
    content.appendChild(actionsDiv);
    taskCard.appendChild(bg);
    taskCard.appendChild(content);
    list.appendChild(taskCard);

}

function getTaskColor(task) {

    // TODO: cases where there is no deadline

    if (task.status === 1) return '#d4edda'; // greenish
    if (!task.dd) return '#fff3cd';

    const now = new Date();
    const deadline = new Date(task.dd);

    if (deadline - now < 24 * 60 * 60 * 1000) return '#f8d7da'; // redish
    return '#fff3cd'; // yellowish
}

// Load saved tasks
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const list = document.getElementById('taskList');
    list.innerHTML = '';
    if (tasks.length === 0) {
        console.log("no tasks");
        showEmptyMessage(list, 'No tasks to display.');
        return;
    }
    tasks.forEach(task => {
        renderTask(task, 'taskList');
    });

}

// render todo tasks
function loadTODO() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const list = document.getElementById('todoList');
    list.innerHTML = '';

    const todo = tasks.filter(task => task.status === 0);
    console.log('Tasks from localStorage:', tasks);
    console.log('Tasks.length:', tasks.length);

    if (todo.length === 0) {
        console.log("no tasks to display");
        showEmptyMessage(list, 'No tasks to do.');
        return;
    }

    todo.forEach(task => renderTask(task, 'todoList'));

}

// msg for empty/no saved tasks
function showEmptyMessage(container, message) {
    const msg = document.createElement('div');
    msg.className = 'text-center text-muted py-3 w-50 mt-4 align-self-center';
    msg.style.border = "3px dashed red";

    msg.innerText = message;
    container.appendChild(msg);
}

function showToast(message, type = 'primary') {
    const toastEl = document.getElementById('toast');
    const toastBody = document.getElementById('toastBody');

    toastBody.innerText = message;

    toastEl.className = `toast align-items=center text-bg-${type} border-0`;

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function sortTasks(type = 'deadline-asc') {

    const sorting = type;

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    if (tasks.length === 0) {
        document.getElementById('taskList').innerHTML = '';
        document.getElementById('todoList').innerHTML = '';
        showEmptyMessage(document.getElementById('taskList'), 'No tasks to display.');
        showEmptyMessage(document.getElementById('todoList'), 'No tasks to do.');
        return;
    }

    let sortedTasks = [...tasks];
    switch (sorting) {
        case 'name-asc':
            sortedTasks.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sortedTasks.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'deadline-asc':
            sortedTasks.sort((a, b) => {
                if (!a.dd && !b.dd) return 0;
                if (!a.dd) return 1;
                if (!b.dd) return -1;
                return new Date(a.dd) - new Date(b.dd);
            });
            break;
        case 'deadline-desc':
            sortedTasks.sort((a, b) => {
                if (!a.dd && !b.dd) return 0;
                if (!a.dd) return -1;
                if (!b.dd) return 1;
                return new Date(b.dd) - new Date(a.dd);
            });
            break;
        case 'created-asc':
            sortedTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'created-desc':
            sortedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }

    document.getElementById('taskList').innerHTML = '';
    document.getElementById('todoList').innerHTML = '';
    sortedTasks.forEach(task => renderTask(task, 'taskList'));
    sortedTasks.filter(t => t.status === 0).forEach(task => renderTask(task, 'todoList'));

    document.querySelectorAll('.sort-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.sort === sorting) {
            opt.classList.add('active');
        }
    });
}

function reloadTasks() {
    const savedSort = localStorage.getItem('sort');
    if (savedSort) {
        sortTasks(savedSort);
    }
    else {
        loadTasks();
        loadTODO();
    }
}

function deleteTask(task) {
    deltask = task;
    const modal = new bootstrap.Modal(document.getElementById('confirmDel'));
    modal.show();
}

function completetask(task) {
    editId = task.id;

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.map(t => {
        if (t.id === editId) {
            const s = t.status === 1;
            return {
                ...t,
                status: s ? 0 : 1
            };
        }
        return t;
    });

    localStorage.setItem('tasks', JSON.stringify(tasks));
    document.getElementById('taskList').innerHTML = '';
    document.getElementById('todoList').innerHTML = '';
    reloadTasks();
}