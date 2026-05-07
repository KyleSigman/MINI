    // ===================== BOARDS FSM =====================


function getBoardDB() {
    const db = localStorage.getItem('boardDB');
    return db ? JSON.parse(db) : { notebooks: [], notes: [] };
}

function saveBoardDB(db) {
    localStorage.setItem('boardDB', JSON.stringify(db));
}

// ===================== РЕНДЕР В ЧАТ =====================
function renderBoardPanel() {
    const db = getBoardDB();
    const container = document.createElement('div');
    container.className = 'message message-other';
    container.id = 'boardPanel';
    
    let html = '';
    
    switch(boardState.page) {
        case 'main':
            html = renderBoardMain(db);
            break;
        case 'create_title':
            html = renderBoardCreateTitle();
            break;
        case 'open_notebook':
            html = renderBoardNotebook(db);
            break;
        case 'add_note':
            html = renderBoardAddNote();
            break;
        case 'edit_note':
            html = renderBoardEditNote(db);
            break;
    }
    
    container.innerHTML = html;
    
    // Удаляем старую панель
    const old = document.getElementById('boardPanel');
    if (old) old.remove();
    document.getElementById('chatMessages').appendChild(container);
    container.scrollIntoView({ behavior: 'smooth' });
}

// ------------------------ ГЛАВНАЯ ------------------------
function renderBoardMain(db) {
    const notebooks = db.notebooks || [];
    let btns = notebooks.map(nb => 
        `<button onclick="boardOpenNotebook('${nb.id}')" style="display:block; width:100%; margin:4px 0; padding:10px; background:#1a1a1a; border:1px solid #33ff33; color:#fff; cursor:pointer; text-align:left;">📁 ${escapeHtml(nb.title)}</button>`
    ).join('');
    
    return `
        <div class="message-container">
            <div class="message-header"><span class="msg-name">📋 Сборки</span></div>
            <div class="message-body">
                <div class="bubble" style="background:#0a0a0a; color:#ccc;">
                    ${btns || '<p style="color:#888;">пусто</p>'}
                    <hr style="border-color:#333;">
                    <button onclick="exportBoard()" style="background:transparent; color:#33ff33; border:1px solid #33ff33; padding:8px; width:100%; margin-top:4px; cursor:pointer;">📤 Экспорт</button>
                    <button onclick="document.getElementById('boardImportInput').click()" style="background:transparent; color:#33ff33; border:1px solid #33ff33; padding:8px; width:100%; margin-top:4px; cursor:pointer;">📥 Импорт</button>
                    <input type="file" id="boardImportInput" onchange="importBoard(this.files[0])" style="display:none;" accept=".enc">
                    <button onclick="boardCreateNotebook()" style="background:#33ff33; color:#000; border:none; padding:8px; width:100%; cursor:pointer;">➕ Новый раздел</button>
                    <button onclick="boardClose()" style="background:transparent; color:#888; border:1px solid #333; padding:8px; width:100%; margin-top:4px; cursor:pointer;">✕ Закрыть</button>
                </div>
            </div>
        </div>
    `;
}


// ------------------------ СОЗДАНИЕ ТЕМЫ ------------------------
function renderBoardCreateTitle() {
    return `
        <div class="message-container">
            <div class="message-header"><span class="msg-name">✏️ Новая тема</span></div>
            <div class="message-body">
                <div class="bubble" style="background:#0a0a0a; color:#ccc;">
                    <p style="color:#33ff33;">Введи название в поле ввода и нажми ➤</p>
                    <button onclick="boardBackToMain()" style="background:transparent; color:#888; border:1px solid #333; padding:8px; width:100%; cursor:pointer;">🔙 Отмена</button>
                </div>
            </div>
        </div>
    `;
}

// ------------------------ ОТКРЫТАЯ ТЕМА ------------------------
function renderBoardNotebook(db) {
    const notebook = db.notebooks.find(n => n.id === boardState.notebookId);
    if (!notebook) { boardBackToMain(); return ''; }
    
    const notes = (db.notes || []).filter(n => n.notebookId === boardState.notebookId);
    let notesHtml = notes.length === 0 
        ? '<p style="color:#888;">пока пусто</p>'
        : notes.map(n => `<div style="border-bottom:1px solid #333; padding:4px 0;">▫️ ${escapeHtml(n.content)}</div>`).join('');
    
    return `
        <div class="message-container">
            <div class="message-header"><span class="msg-name">📁 ${escapeHtml(notebook.title)}</span></div>
            <div class="message-body">
                <div class="bubble" style="background:#0a0a0a; color:#ccc; max-height:300px; overflow-y:auto;">
                    ${notesHtml}
                    <hr style="border-color:#333;">
                    <button onclick="boardAddNotePrompt()" style="background:#33ff33; color:#000; border:none; padding:8px; width:100%; cursor:pointer;">✏️ Добавить</button>
                    <button onclick="boardEditNotesPrompt()" style="background:#ffaa00; color:#000; border:none; padding:8px; width:100%; margin-top:4px; cursor:pointer;">📝 Редактировать</button>
                    <button onclick="boardDeleteNotebook()" style="background:#d32f2f; color:#fff; border:none; padding:8px; width:100%; margin-top:4px; cursor:pointer;">🗑️ Удалить тему</button>
                    <button onclick="boardBackToMain()" style="background:transparent; color:#888; border:1px solid #333; padding:8px; width:100%; margin-top:4px; cursor:pointer;">⬅️ Назад</button>
                </div>
            </div>
        </div>
    `;
}

// ------------------------ ДОБАВЛЕНИЕ ЗАМЕТКИ ------------------------
function renderBoardAddNote() {
    return `
        <div class="message-container">
            <div class="message-header"><span class="msg-name">✏️ Новая заметка</span></div>
            <div class="message-body">
                <div class="bubble" style="background:#0a0a0a; color:#ccc;">
                    <p style="color:#33ff33;">Введи текст в поле ввода и нажми ➤</p>
                    <button onclick="boardOpenNotebook(boardState.notebookId)" style="background:transparent; color:#888; border:1px solid #333; padding:8px; width:100%; cursor:pointer;">🔙 Отмена</button>
                </div>
            </div>
        </div>
    `;
}

// ------------------------ РЕДАКТИРОВАНИЕ ЗАМЕТКИ ------------------------
function renderBoardEditNote(db) {
    const note = (db.notes || []).find(n => n.id === boardState.noteId);
    if (!note) { boardBackToMain(); return ''; }
    
    return `
        <div class="message-container">
            <div class="message-header"><span class="msg-name">📝 Редактировать</span></div>
            <div class="message-body">
                <div class="bubble" style="background:#0a0a0a; color:#ccc;">
                    <p style="color:#888;">Текущий текст:</p>
                    <p>${escapeHtml(note.content)}</p>
                    <p style="color:#33ff33;">Введи новый текст и нажми ➤</p>
                    <button onclick="boardDeleteNote()" style="background:#d32f2f; color:#fff; border:none; padding:8px; width:100%; margin-top:4px; cursor:pointer;">🗑️ Удалить</button>
                    <button onclick="boardEditNotesPrompt()" style="background:transparent; color:#888; border:1px solid #333; padding:8px; width:100%; margin-top:4px; cursor:pointer;">🔙 Назад</button>
                </div>
            </div>
        </div>
    `;
}

// ===================== ДЕЙСТВИЯ =====================
function boardCreateNotebook() {
    boardState.page = 'create_title';
    boardState.awaitingInput = 'title';
    renderBoardPanel();
}

function boardOpenNotebook(id) {
    boardState.page = 'open_notebook';
    boardState.notebookId = id;
    boardState.awaitingInput = null;
    renderBoardPanel();
}

function boardAddNotePrompt() {
    boardState.page = 'add_note';
    boardState.awaitingInput = 'note';
    renderBoardPanel();
}

function boardEditNotesPrompt() {
    boardState.page = 'edit_notes_list';
    boardState.awaitingInput = null;
    renderBoardEditNotesList();
}

function boardEditNotePrompt(noteId) {
    boardState.page = 'edit_note';
    boardState.noteId = noteId;
    boardState.awaitingInput = 'edit_note';
    renderBoardPanel();
}

function boardBackToMain() {
    boardState.page = 'main';
    boardState.notebookId = null;
    boardState.noteId = null;
    boardState.awaitingInput = null;
    renderBoardPanel();
}

function boardClose() {
    boardState.active = false;
    boardState.awaitingInput = null;
    const panel = document.getElementById('boardPanel');
    if (panel) panel.remove();
    document.getElementById('messageInput').placeholder = 'Сообщение...';
}

function boardDeleteNotebook() {
    if (!confirm('Удалить тему и все заметки?')) return;
    const db = getBoardDB();
    db.notes = db.notes.filter(n => n.notebookId !== boardState.notebookId);
    db.notebooks = db.notebooks.filter(n => n.id !== boardState.notebookId);
    saveBoardDB(db);
    boardBackToMain();
}

function boardDeleteNote() {
    if (!confirm('Удалить заметку?')) return;
    const db = getBoardDB();
    db.notes = db.notes.filter(n => n.id !== boardState.noteId);
    saveBoardDB(db);
    boardBackToMain();
}

// ===================== ОБРАБОТКА ИНПУТА =====================
function handleBoardInput(text) {
    if (!boardState.active || !boardState.awaitingInput) return false;
    
    const db = getBoardDB();
    
    if (boardState.awaitingInput === 'title') {
        if (text.length < 2) { alert('Название от 2 символов'); return true; }
        const id = Date.now().toString(36);
        db.notebooks.push({ id, title: text, createdAt: Date.now() });
        saveBoardDB(db);
        boardState.notebookId = id;
        boardState.page = 'open_notebook';
        boardState.awaitingInput = null;
        renderBoardPanel();
        return true;
    }
    
    if (boardState.awaitingInput === 'note') {
        db.notes.push({ id: Date.now().toString(36), notebookId: boardState.notebookId, content: text, createdAt: Date.now() });
        saveBoardDB(db);
        boardState.page = 'open_notebook';
        boardState.awaitingInput = null;
        renderBoardPanel();
        return true;
    }
    
    if (boardState.awaitingInput === 'edit_note') {
        const note = db.notes.find(n => n.id === boardState.noteId);
        if (note) note.content = text;
        saveBoardDB(db);
        boardState.page = 'open_notebook';
        boardState.awaitingInput = null;
        boardState.noteId = null;
        renderBoardPanel();
        return true;
    }
    
    return false;
}

function exportBoard() {
    const db = localStorage.getItem('boardDB');
    if (!db) return alert('Нет данных для экспорта');
    const encoded = btoa(encodeURIComponent(db));
    const blob = new Blob([encoded], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'my_boards.enc';
    a.click();
}

function importBoard(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const decoded = decodeURIComponent(atob(e.target.result));
            JSON.parse(decoded);
            localStorage.setItem('boardDB', decoded);
            alert('✅ Импортировано!');
            renderBoardPanel();
        } catch(ex) {
            alert('❌ Неверный формат файла');
        }
    };
    reader.readAsText(file);
}




function loadInbox() {
const inboxEl = document.getElementById('inboxMessages');
if (!inboxEl) return;

db.collection(`privateMessages/${currentUserId}/messages`)
    .orderBy('timestamp', 'desc')
    .onSnapshot(snap => {
        inboxEl.innerHTML = '';
        if (snap.empty) {
            inboxEl.innerHTML = '<div style="color:#888;">пока пусто</div>';
            return;
        }
        snap.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.style.cssText = 'margin-bottom:8px; padding:8px; border-left:3px solid #33ff33; background: rgba(123,123,123, 0.5); border-radius:10px;';
            div.innerHTML = `
<div style="display:flex; justify-content:space-between; color:#888; font-size:11px; margin-bottom:4px;">
    <span>${data.timestamp?.toDate().toLocaleString()}</span>
</div>
<div style="color:#fff; margin-bottom:4px;">${escapeHtml(data.text)}</div>
${data.answer ? `<div style="color:#33ff33; border-top:1px solid #333; padding-top:4px;">↩ ${escapeHtml(data.answer)} (ящик: ${escapeHtml(data.accessCode)})</div>` : 
`<button onclick="replyToInbox('${doc.id}')" style="background:transparent; color: rgb(150,255,0); border:1px solid rgb(150,255,0); padding:5px 10px; border-radius:20px; cursor:pointer; font-size:16px;">ответить</button>`}
`;
            inboxEl.appendChild(div);
        });
    });
}

function replyToInbox(docId, accessCode) {
const reply = prompt('Ответ:');
if (!reply) return;
db.collection(`privateMessages/${currentUserId}/messages`).doc(docId).update({
    answer: reply,
    answerTimestamp: firebase.firestore.FieldValue.serverTimestamp()
});
}

document.querySelectorAll('.tab-btn').forEach(btn => {
btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    if (tabId === 'inbox') loadInbox();
});
});



async function sendMiniMessage() {
    const input = document.getElementById('miniMessageInput');
    const rawText = input.value.trim();
    if (!rawText) return;
    
    // Парсим код_сообщение
    const underscoreIndex = rawText.indexOf('_');
    if (underscoreIndex === -1) {
        alert('Формат: код_сообщение');
        return;
    }
    
    const accessCode = rawText.substring(0, underscoreIndex).trim();
    const messageText = rawText.substring(underscoreIndex + 1).trim();
    
    if (!accessCode || !messageText) {
        alert('Формат: код_сообщение');
        return;
    }
    
    // Ищем пользователя по полю mail
    const snapshot = await db.collection('neighbours')
        .where('mail', '==', accessCode)
        .limit(1)
        .get();
    
    if (snapshot.empty) {
        alert('Пользователь с таким кодом не найден');
        return;
    }
    
    const targetUserId = snapshot.docs[0].id;
    
    // Сохраняем сообщение
    const docRef = await db.collection(`privateMessages/${targetUserId}/messages`).add({
        text: messageText,
        accessCode: accessCode,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'text'
    });
    
    input.value = '';

    const unsubscribe = db.collection(`privateMessages/${targetUserId}/messages`)
    .doc(docRef.id)
    .onSnapshot(snap => {
        const data = snap.data();
        if (data && data.answer) {
            const answerDiv = document.createElement('div');
            answerDiv.style.cssText = 'color:#33ff33; margin-top:4px; padding:4px 8px; border-left:2px solid #33ff33;';
            answerDiv.textContent = '↩ ' + data.answer + ' (' + accessCode + ')';
            document.getElementById('miniChatMessages').appendChild(answerDiv);
            unsubscribe();
        }
    });
    
    // Показываем в мини-чате
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = 'color:#fff; margin-bottom:4px;';
    msgDiv.textContent = messageText;
    document.getElementById('miniChatMessages').appendChild(msgDiv);
}



    let alienMode = false;
let selectedMsgIds = [];

document.getElementById('alienOpenBtn').addEventListener('click', () => {
    document.getElementById('alienPanel').style.display = 'block';
});

document.getElementById('alienCloseBtn').addEventListener('click', () => {
    document.getElementById('alienPanel').style.display = 'none';
    alienMode = false;
    document.getElementById('alienToggleBtn').classList.remove('active');
});

document.getElementById('alienToggleBtn').addEventListener('click', () => {
    alienMode = !alienMode;
    document.getElementById('alienToggleBtn').classList.toggle('active', alienMode);
});

// При клике на сообщение в режиме маскирования
document.getElementById('chatMessages').addEventListener('click', (e) => {
    if (!alienMode) return;
    
    const messageDiv = e.target.closest('.message');
    if (!messageDiv) return;
    
    const msgId = messageDiv.id.replace('msg-', '');
    const color = document.getElementById('alienColor').value;
    
    if (selectedMsgIds.includes(msgId)) {
        selectedMsgIds = selectedMsgIds.filter(id => id !== msgId);
        messageDiv.style.outline = '';
    } else {
        selectedMsgIds.push(msgId);
        messageDiv.style.outline = `3px solid ${color}`;
    }
    
    document.getElementById('alienSelectedCount').textContent = `Выбрано: ${selectedMsgIds.length}`;
});

document.getElementById('alienConfirmBtn').addEventListener('click', async () => {
    const name = document.getElementById('alienName').value.trim();
    if (!name) return alert('Введите имя маски');
    if (selectedMsgIds.length === 0) return alert('Выберите сообщения');
    
    const color = document.getElementById('alienColor').value;
    const collection = chatState.mode === 'general' ? 'chatcontent' : `privateMessages/${chatState.chatId}/messages`;
    const groupId = `group_${name}_${Date.now()}`;
    
    await db.collection(collection).doc(groupId).set({
        type: 'group',
        name,
        color,
        msgIds: selectedMsgIds,
        createdBy: currentUserId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Сброс
    selectedMsgIds.forEach(id => {
        const el = document.getElementById(`msg-${id}`);
        if (el) el.style.outline = '';
    });
    selectedMsgIds = [];
    document.getElementById('alienSelectedCount').textContent = 'Выбрано: 0';
    document.getElementById('alienPanel').style.display = 'none';
    alienMode = false;
    document.getElementById('alienToggleBtn').classList.remove('active');
});

document.getElementById('alienUICloseBtn').addEventListener('click', () => {
    document.getElementById('alienUI').style.display = 'none';
    document.querySelector('.alien-btn').style.display = 'none';
});


function loadChatsList() {
    console.log('Используй loadContactsList');
}
function debugChats() {
    console.log('╔══════════════════════════════╗');
    console.log('║     CHAT SYSTEM DEBUG       ║');
    console.log('╚══════════════════════════════╝');
    console.log('👤 currentUserId:', currentUserId);
    console.log('📌 chatState:', JSON.stringify(chatState, null, 2));
    console.log('📑 activeChats:', JSON.stringify(activeChats, null, 2));
    console.log('🔊 currentUnsubscribe:', currentUnsubscribe ? 'active' : 'none');
    
    // Проверка на дубликаты
    const ids = activeChats.map(c => c.chatId);
    const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dups.length) console.warn('⚠️ ДУБЛИКАТЫ:', dups);
    
    // Проверка на несоответствие chatId и userId
    activeChats.forEach(c => {
        const expectedChatId = [currentUserId, c.userId].sort().join('_');
        if (c.chatId !== expectedChatId) {
            console.warn('⚠️ chatId/userId mismatch:', c.chatId, '≠', expectedChatId);
        }
    });
    
    // Текущий DOM вкладок
    const tabs = document.querySelectorAll('.chat-tab');
    console.log('🏷️ DOM вкладок:', tabs.length);
    tabs.forEach((t, i) => console.log(`  ${i}: "${t.textContent.trim()}" active:${t.classList.contains('active')}`));
    
    // Текущий заголовок чата
    console.log('📝 chatTitle:', document.getElementById('chatTitle')?.textContent);
}




{/* <script type="text/markdown" id="md-content">
# 🏠 My Place — личное пространство

**Главный Дизайнер**

---

## Что такое My Place?

Это личная переписка для своего аккаунта. Открывается сразу при входе — вкладка с домиком 🏠. Никто, кроме тебя, не видит эти сообщения.

*Пиши заметки, мысли, команды. Всё в одном месте.*

---

## 📓 Сборки (блокнот)

`++б` — открыть панель сборок  
`++б -н Название` — создать новую тему  
`++б Тема текст` — добавить заметку в тему  

*Храни ссылки, промты, тексты. Экспортируй в файл. Импортируй обратно.*

---

## 💳 Лицевые счета

`++лс Название | номер | организация | заметка`  
`++лск` — показать все счета  

*Все номера счетов, договоров, лицевых — в одном месте.*

---

## ⚙️ Настройки

`++настр` — открыть панель настроек  

*Звуки, тема оформления — переключай не выходя из чата.*

---

## 🍀 Статус

`++он` — онлайн  
`++оф` — офлайн  
`++зт` — занят  

*Меняй статус одной командой.*

---

</script> */}







