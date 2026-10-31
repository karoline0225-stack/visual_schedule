// 탭 목록 ('한번' 및 월~일)
const days = [
  { id: 'once', label: '한번', name: '한번' },
  { id: 'mon', label: '월', name: '월요일' },
  { id: 'tue', label: '화', name: '화요일' },
  { id: 'wed', label: '수', name: '수요일' },
  { id: 'thu', label: '목', name: '목요일' },
  { id: 'fri', label: '금', name: '금요일' },
  { id: 'sat', label: '토', name: '토요일' },
  { id: 'sun', label: '일', name: '일요일' }
];

let currentDay = 'mon';
let schedules = JSON.parse(localStorage.getItem('ruda_schedules') || '{}');

// 구버전 데이터 키 호환성 처리 (월, 화 -> 월요일, 화요일)
['월', '화', '수', '목', '금', '토', '일'].forEach(oldKey => {
  if (schedules[oldKey]) {
    const matching = days.find(d => d.label === oldKey);
    if (matching && !schedules[matching.id]) {
      schedules[matching.id] = schedules[oldKey];
    }
    delete schedules[oldKey];
  }
});

// DOM 요소
const dayTabsContainer = document.getElementById('dayTabsContainer');
const scheduleList = document.getElementById('scheduleList');
const doneBox = document.getElementById('doneBox');
const mainTitle = document.getElementById('mainTitle');
const imageInput = document.getElementById('imageInput');

// 탭 스크롤 제어 함수
function scrollTabs(direction) {
  dayTabsContainer.scrollBy({ left: direction * 120, behavior: 'smooth' });
}

// 초기 탭 렌더링
function renderTabs() {
  dayTabsContainer.innerHTML = '';
  days.forEach(day => {
    const btn = document.createElement('button');
    const isSelected = currentDay === day.id;
    
    let baseClasses = "px-4 py-2.5 rounded-2xl font-bold text-sm snap-start transition-all duration-200 whitespace-nowrap shadow-sm flex-shrink-0";
    let colorClasses = "";

    if (isSelected) {
      if (day.id === 'sat') {
        colorClasses = "bg-sky-100 text-sky-700 border-2 border-sky-300 scale-105 shadow-md";
      } else if (day.id === 'sun') {
        colorClasses = "bg-rose-100 text-rose-700 border-2 border-rose-300 scale-105 shadow-md";
      } else {
        colorClasses = "bg-rudaMint text-white shadow-md scale-105 border-2 border-rudaMint";
      }
    } else {
      colorClasses = "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200/80";
    }

    btn.className = `${baseClasses} ${colorClasses}`;
    btn.textContent = day.label;
    btn.onclick = () => {
      currentDay = day.id;
      mainTitle.textContent = `${day.name} 스케줄 보드 🗓️`;
      renderTabs();
      renderSchedules();
    };
    dayTabsContainer.appendChild(btn);
  });
}

// 스케줄 데이터 저장
function saveSchedules() {
  localStorage.setItem('ruda_schedules', JSON.stringify(schedules));
}

// 여러 장의 이미지 압축 및 업로드 처리
imageInput.addEventListener('change', function(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  if (!schedules[currentDay]) {
    schedules[currentDay] = { active: [], done: [] };
  }

  let processedCount = 0;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 600;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        schedules[currentDay].active.push({
          id: Date.now() + Math.random(), // 중복 ID 방지
          text: '',
          img: compressedDataUrl
        });

        processedCount++;
        // 모든 파일 처리가 완료되면 화면을 갱신하고 input 초기화
        if (processedCount === files.length) {
          saveSchedules();
          renderSchedules();
          imageInput.value = '';
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
});

// 스케줄 목록 렌더링 (사진 크기 큼직하게 1/2 비율 유지)
function renderSchedules() {
  const dayData = schedules[currentDay] || { active: [], done: [] };
  scheduleList.innerHTML = '';
  doneBox.innerHTML = '';

  // 해야 할 일 렌더링
  if (dayData.active.length === 0) {
    scheduleList.innerHTML = `
      <div class="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
        등록된 스케줄이 없어요.<br>위의 '사진 추가하기' 버튼을 눌러 시작해보세요! 📸
      </div>
    `;
  } else {
    dayData.active.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = "schedule-card bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 relative";
      card.innerHTML = `
        <img src="${item.img}" alt="스케줄 사진" class="w-1/2 aspect-square object-cover rounded-xl border border-gray-100 flex-shrink-0 shadow-sm">
        <div class="flex-1 flex flex-col justify-between h-full py-1">
          <h3 class="text-lg font-bold text-gray-800 break-words leading-snug mb-3">${item.text}</h3>
          <div class="flex flex-wrap items-center gap-1.5 no-print">
            <button onclick="moveToDone(${item.id})" class="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-rudaMint rounded-lg font-bold text-xs shadow-sm transition-transform active:scale-95">🎯 끝</button>
            <button onclick="openEditModal('${currentDay}', 'active', ${item.id}, '${item.text.replace(/'/g, "\\'")}')" class="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-semibold text-xs transition-transform active:scale-95">✏️수정</button>
            <button onclick="deleteSchedule('${currentDay}', 'active', ${item.id})" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rudaPink rounded-lg font-semibold text-xs transition-transform active:scale-95">🗑️</button>
          </div>
          <div class="flex items-center gap-1 mt-2 no-print">
            <button onclick="moveOrder('${currentDay}', 'active', ${index}, -1)" class="w-7 h-7 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg text-xs font-bold flex items-center justify-center ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" ${index === 0 ? 'disabled' : ''}>▲</button>
            <button onclick="moveOrder('${currentDay}', 'active', ${index}, 1)" class="w-7 h-7 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg text-xs font-bold flex items-center justify-center ${index === dayData.active.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" ${index === dayData.active.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
        </div>
      `;
      scheduleList.appendChild(card);
    });
  }

  // 끝 박스 렌더링
  if (dayData.done.length === 0) {
    doneBox.innerHTML = `
      <div class="text-center py-4 text-gray-400 text-sm font-medium">
        아직 끝난 스케줄이 없어요!
      </div>
    `;
  } else {
    dayData.done.forEach((item) => {
      const card = document.createElement('div');
      card.className = "schedule-card done-card bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-4 relative";
      card.innerHTML = `
        <img src="${item.img}" alt="완료된 스케줄" class="w-1/2 aspect-square object-cover rounded-xl flex-shrink-0">
        <div class="flex-1 flex flex-col justify-between h-full py-1">
          <h3 class="text-lg font-semibold text-gray-500 line-through break-words leading-snug mb-3">${item.text}</h3>
          <div class="no-print">
            <button onclick="restoreFromDone(${item.id})" class="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg font-bold text-xs shadow-sm transition-transform active:scale-95">🔄 다시 꺼내기</button>
          </div>
        </div>
      `;
      doneBox.appendChild(card);
    });
  }
}

// 순서 이동
function moveOrder(dayKey, type, index, direction) {
  const list = schedules[dayKey][type];
  const targetIdx = index + direction;
  if (targetIdx < 0 || targetIdx >= list.length) return;
  const temp = list[index];
  list[index] = list[targetIdx];
  list[targetIdx] = temp;
  saveSchedules();
  renderSchedules();
}

// 끝 박스로 이동
function moveToDone(id) {
  const dayData = schedules[currentDay];
  const idx = dayData.active.findIndex(item => item.id === id);
  if (idx > -1) {
    const [item] = dayData.active.splice(idx, 1);
    dayData.done.push(item);
    saveSchedules();
    renderSchedules();
  }
}

// 끝 박스에서 꺼내기
function restoreFromDone(id) {
  const dayData = schedules[currentDay];
  const idx = dayData.done.findIndex(item => item.id === id);
  if (idx > -1) {
    const [item] = dayData.done.splice(idx, 1);
    dayData.active.push(item);
    saveSchedules();
    renderSchedules();
  }
}

// 끝난 스케줄 모두 되돌리기
function restoreAllDones() {
  const dayData = schedules[currentDay];
  if (!dayData || dayData.done.length === 0) return;
  dayData.active.push(...dayData.done);
  dayData.done = [];
  saveSchedules();
  renderSchedules();
}

// 현재 탭 스케줄 전체 리셋하기
function resetCurrentDay() {
  const dayObj = days.find(d => d.id === currentDay);
  if (confirm(`정말 [${dayObj ? dayObj.name : '현재'} 스케줄]의 모든 카드를 삭제하시겠습니까?`)) {
    schedules[currentDay] = { active: [], done: [] };
    saveSchedules();
    renderSchedules();
  }
}

// 삭제
function deleteSchedule(dayKey, type, id) {
  if (confirm("이 스케줄 카드를 삭제하시겠습니까?")) {
    schedules[dayKey][type] = schedules[dayKey][type].filter(item => item.id !== id);
    saveSchedules();
    renderSchedules();
  }
}

// 모달 제어 (이름 수정)
const customModal = document.getElementById('customModal');
const modalContent = document.getElementById('modalContent');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

function openEditModal(dayKey, type, id, currentText) {
  modalTitle.textContent = "스케줄 이름 수정";
  modalInput.value = currentText;
  modalInput.classList.remove('hidden-input');
  customModal.classList.remove('hidden');
  setTimeout(() => {
    customModal.classList.remove('opacity-0');
    modalContent.classList.remove('scale-95');
    modalContent.classList.add('scale-100');
    modalInput.focus();
  }, 10);

  modalConfirm.onclick = function() {
    const newText = modalInput.value.trim();
    const item = schedules[dayKey][type].find(i => i.id === id);
    if (item) {
      item.text = newText;
      saveSchedules();
      renderSchedules();
    }
    closeModal();
  };

  modalCancel.onclick = closeModal;
}

function closeModal() {
  customModal.classList.add('opacity-0');
  modalContent.classList.remove('scale-100');
  modalContent.classList.add('scale-95');
  setTimeout(() => {
    customModal.classList.add('hidden');
  }, 200);
}

// 설명서 모달 제어
const manualModal = document.getElementById('manualModal');
const manualModalContent = document.getElementById('manualModalContent');

function showManual() {
  manualModal.classList.remove('hidden');
  setTimeout(() => {
    manualModal.classList.remove('opacity-0');
    manualModalContent.classList.remove('scale-95');
    manualModalContent.classList.add('scale-100');
  }, 10);
}

function hideManual() {
  manualModal.classList.add('opacity-0');
  manualModalContent.classList.remove('scale-100');
  manualModalContent.classList.add('scale-95');
  setTimeout(() => {
    manualModal.classList.add('hidden');
  }, 200);
}

// 앱 실행 시 초기 렌더링
renderTabs();
renderSchedules();