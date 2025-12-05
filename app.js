// 백엔드 API 주소
const API_URL = 'http://localhost:5000/todos';

// DOM 요소들
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const editModal = document.getElementById('editModal');
const editInput = document.getElementById('editInput');
const modalClose = document.getElementById('modalClose');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');
const pendingCount = document.getElementById('pendingCount');

// 상태
let todos = [];
let editingId = null;

// 할일 목록 조회 (Read)
async function fetchTodos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('할일 목록을 불러오는데 실패했습니다.');
        }
        todos = await response.json();
        renderTodos();
    } catch (error) {
        console.error("데이터 로드 오류:", error);
        alert("할일 목록을 불러오는데 실패했습니다. 서버가 실행중인지 확인해주세요.");
    }
}

// 할일 추가 (Create)
async function addTodo() {
    const title = todoInput.value.trim();
    if (!title) {
        todoInput.focus();
        shakeElement(todoInput.parentElement);
        return;
    }

    // 버튼 비활성화 (중복 클릭 방지)
    addBtn.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '할일 추가에 실패했습니다.');
        }

        const newTodo = await response.json();
        todos.unshift(newTodo);
        renderTodos();
        
        todoInput.value = '';
        todoInput.focus();
    } catch (error) {
        console.error("할일 추가 오류:", error);
        alert(error.message || "할일 추가에 실패했습니다. 다시 시도해주세요.");
    } finally {
        addBtn.disabled = false;
    }
}

// 요소 흔들기 애니메이션
function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// 할일 삭제 (Delete)
async function deleteTodo(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) {
        item.classList.add('removing');
        
        setTimeout(async () => {
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('삭제에 실패했습니다.');
                }

                todos = todos.filter(todo => todo._id !== id);
                renderTodos();
            } catch (error) {
                console.error("할일 삭제 오류:", error);
                item.classList.remove('removing');
                alert("삭제에 실패했습니다. 다시 시도해주세요.");
            }
        }, 400);
    }
}

// 할일 완료 토글 (Update)
async function toggleTodo(id) {
    const todo = todos.find(t => t._id === id);
    if (!todo) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                title: todo.title,
                completed: !todo.completed 
            })
        });

        if (!response.ok) {
            throw new Error('상태 변경에 실패했습니다.');
        }

        const updatedTodo = await response.json();
        todos = todos.map(t => t._id === id ? updatedTodo : t);
        renderTodos();
    } catch (error) {
        console.error("상태 변경 오류:", error);
        alert("상태 변경에 실패했습니다. 다시 시도해주세요.");
    }
}

// 수정 모달 열기
function openEditModal(id) {
    const todo = todos.find(t => t._id === id);
    if (todo) {
        editingId = id;
        editInput.value = todo.title;
        editModal.classList.add('active');
        setTimeout(() => editInput.focus(), 100);
    }
}

// 수정 모달 닫기
function closeEditModal() {
    editModal.classList.remove('active');
    editingId = null;
    editInput.value = '';
}

// 할일 수정 저장 (Update)
async function saveEditedTodo() {
    const title = editInput.value.trim();
    if (!title || !editingId) {
        shakeElement(editInput);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${editingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '수정에 실패했습니다.');
        }

        const updatedTodo = await response.json();
        todos = todos.map(t => t._id === editingId ? updatedTodo : t);
        renderTodos();
        closeEditModal();
    } catch (error) {
        console.error("할일 수정 오류:", error);
        alert(error.message || "수정에 실패했습니다. 다시 시도해주세요.");
    }
}

// 통계 업데이트
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;

    animateNumber(totalCount, total);
    animateNumber(completedCount, completed);
    animateNumber(pendingCount, pending);
}

// 숫자 애니메이션
function animateNumber(element, target) {
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;

    const duration = 300;
    const start = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(current + (target - current) * easeProgress);
        element.textContent = value;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// 할일 목록 렌더링
function renderTodos() {
    todoList.innerHTML = '';

    if (todos.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');

        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo._id;
            li.style.animationDelay = `${index * 0.05}s`;

            li.innerHTML = `
                <label class="checkbox-wrapper">
                    <input type="checkbox" class="checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <span class="todo-text">${escapeHtml(todo.title)}</span>
                <div class="todo-actions">
                    <button class="action-btn edit-btn" title="수정">✏️</button>
                    <button class="action-btn delete-btn" title="삭제">🗑️</button>
                </div>
            `;

            // 체크박스 이벤트
            const checkbox = li.querySelector('.checkbox');
            checkbox.addEventListener('change', () => toggleTodo(todo._id));

            // 수정 버튼 이벤트
            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => openEditModal(todo._id));

            // 삭제 버튼 이벤트
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTodo(todo._id));

            todoList.appendChild(li);
        });
    }

    updateStats();
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 이벤트 리스너
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

modalClose.addEventListener('click', closeEditModal);
cancelEdit.addEventListener('click', closeEditModal);
saveEdit.addEventListener('click', saveEditedTodo);

editInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveEditedTodo();
    }
});

// 모달 배경 클릭 시 닫기
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('active')) {
        closeEditModal();
    }
});

// CSS에 shake 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-10px); }
        40% { transform: translateX(10px); }
        60% { transform: translateX(-10px); }
        80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// 초기화 - 할일 목록 불러오기
fetchTodos();
