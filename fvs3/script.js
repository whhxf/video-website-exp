// 摄像头模拟数据
const cameras = [
    {
        id: 1,
        name: "生产车间 A区",
        shortName: "车间A",
        description: "主要生产车间，拥有20条自动化产线，日产能达50000件。配备先进的德国进口设备。",
        position: { x: 75, y: 80 },
        videoUrl: "videoplayback.mp4",
        online: true
    },
    {
        id: 2,
        name: "生产车间 B区",
        shortName: "车间B",
        description: "高精密零件加工区，恒温恒湿环境，确保产品精度符合国际最高标准。",
        position: { x: 280, y: 80 },
        videoUrl: "videoplayback.mp4",
        online: true
    },
    {
        id: 3,
        name: "成品仓库",
        shortName: "仓库",
        description: "现代化物流中心，支持智能仓储管理系统，年货物吞吐量超过100万件。",
        position: { x: 70, y: 210 },
        videoUrl: "videoplayback.mp4",
        online: true
    },
    {
        id: 4,
        name: "质检与包装区",
        shortName: "质检区",
        description: "严格的100%全检流程，每一件出厂产品都经过多道质量把关，确保零缺陷交付。",
        position: { x: 250, y: 210 },
        videoUrl: "videoplayback.mp4",
        online: true
    },
    {
        id: 5,
        name: "研发中心",
        shortName: "研发部",
        description: "汇聚行业顶尖人才，拥有多项技术专利，持续推动产品创新与迭代。",
        position: { x: 350, y: 250 },
        videoUrl: "videoplayback.mp4",
        online: true
    },
    {
        id: 6,
        name: "工厂正门",
        shortName: "正门",
        description: "工厂园区主入口，配备人脸识别与车辆追踪系统，全天候保障生产安全。",
        position: { x: 200, y: 280 },
        videoUrl: "videoplayback.mp4",
        online: true
    }
];

let currentCameraId = 1;

// 云台状态 (PTZ State)
let ptzState = {
    scale: 1.5, // 默认放大 1.5 倍
    x: 0,
    y: 0
};

// 常量配置
const PTZ_CONFIG = {
    defaultScale: 1.5, // 默认缩放
    stepScale: 0.5,    // 每次缩放倍数
    stepMove: 100,     // 每次移动像素
    minScale: 1,       // 最小缩放
    maxScale: 4        // 最大缩放
};

function init() {
    renderCameraList();
    renderMarkers();
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    
    // 绑定云台方向控制
    document.querySelectorAll('.ptz-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dir = e.target.closest('button').dataset.dir;
            handlePTZMove(dir);
        });
    });

    // 绑定变倍控制
    document.querySelectorAll('.action-btn').forEach(btn => {
        const text = btn.textContent;
        if (text.includes('变倍 +')) {
            btn.onclick = () => handleZoom(1);
        } else if (text.includes('变倍 -')) {
            btn.onclick = () => handleZoom(-1);
        } else if (text.includes('全屏')) {
            btn.onclick = toggleFullscreen;
        }
    });

    // 默认选中第一个
    switchCamera(1);
}

// 渲染镜头列表
function renderCameraList() {
    const listContainer = document.getElementById('camera-list');
    listContainer.innerHTML = cameras.map(cam => `
        <div class="cam-card ${cam.id === currentCameraId ? 'active' : ''}" id="cam-card-${cam.id}" onclick="switchCamera(${cam.id})">
            <div class="status-dot"></div>
            <div class="cam-thumb">📸</div>
            <div class="cam-name">${cam.name}</div>
        </div>
    `).join('');
}

// 渲染平面图标记
function renderMarkers() {
    const markerGroup = document.getElementById('camera-markers');
    markerGroup.innerHTML = cameras.map(cam => `
        <g class="cam-marker ${cam.id === currentCameraId ? 'active' : ''}" 
           id="marker-${cam.id}"
           onclick="switchCamera(${cam.id})" 
           transform="translate(${cam.position.x}, ${cam.position.y})">
            <circle r="6" />
            <text dx="10" dy="4">${cam.shortName}</text>
        </g>
    `).join('');
}

function switchCamera(id) {
    const cam = cameras.find(c => c.id === id);
    if (!cam) return;

    currentCameraId = id;

    document.querySelectorAll('.cam-card').forEach(el => el.classList.remove('active'));
    const activeCard = document.getElementById(`cam-card-${id}`);
    if (activeCard) activeCard.classList.add('active');
    
    document.querySelectorAll('.cam-marker').forEach(el => el.classList.remove('active'));
    const activeMarker = document.getElementById(`marker-${id}`);
    if (activeMarker) activeMarker.classList.add('active');

    document.getElementById('overlay-cam-name').textContent = `#${cam.id} ${cam.name}`;
    document.getElementById('info-title').textContent = cam.name;
    document.getElementById('info-desc').textContent = cam.description;
}

// ------- 核心 PTZ 逻辑 --------

function resetPTZ() {
    ptzState = { 
        scale: PTZ_CONFIG.defaultScale, 
        x: 0, 
        y: 0 
    };
    applyTransform();
}

function handleZoom(direction) {
    const newScale = ptzState.scale + (direction * PTZ_CONFIG.stepScale);
    
    if (newScale >= PTZ_CONFIG.minScale && newScale <= PTZ_CONFIG.maxScale) {
        ptzState.scale = newScale;
        validatePosition();
        applyTransform();
    }
}

function handlePTZMove(dir) {
    switch(dir) {
        case 'left':  ptzState.x += PTZ_CONFIG.stepMove; break;
        case 'right': ptzState.x -= PTZ_CONFIG.stepMove; break;
        case 'up':    ptzState.y += PTZ_CONFIG.stepMove; break;
        case 'down':  ptzState.y -= PTZ_CONFIG.stepMove; break;
    }

    validatePosition();
    applyTransform();
}

function validatePosition() {
    const videoEl = document.getElementById('main-video');
    const width = videoEl ? (videoEl.clientWidth || 800) : 800;
    const height = videoEl ? (videoEl.clientHeight || 450) : 450;
    
    const maxX = (ptzState.scale - 1) * (width / 2);
    const maxY = (ptzState.scale - 1) * (height / 2);

    if (ptzState.x > maxX) ptzState.x = maxX;
    if (ptzState.x < -maxX) ptzState.x = -maxX;
    if (ptzState.y > maxY) ptzState.y = maxY;
    if (ptzState.y < -maxY) ptzState.y = -maxY;
}

function applyTransform() {
    const video = document.getElementById('main-video');
    if (!video) return;
    video.style.transform = `translate3d(${ptzState.x}px, ${ptzState.y}px, 0) scale(${ptzState.scale})`;
}

function toggleFullscreen() {
    const videoSection = document.querySelector('.video-section');
    if (!document.fullscreenElement) {
        videoSection.requestFullscreen().catch(err => {
            console.log(`Error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

function updateSystemTime() {
    const now = new Date();
    const timeStr = now.getFullYear() + '-' + 
                    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(now.getDate()).padStart(2, '0') + ' ' + 
                    String(now.getHours()).padStart(2, '0') + ':' + 
                    String(now.getMinutes()).padStart(2, '0') + ':' + 
                    String(now.getSeconds()).padStart(2, '0');
    
    const sysTimeEl = document.getElementById('system-time');
    const overlayTimeEl = document.getElementById('overlay-cam-time');
    if (sysTimeEl) sysTimeEl.textContent = timeStr;
    if (overlayTimeEl) overlayTimeEl.textContent = timeStr;
}

window.onload = init;
