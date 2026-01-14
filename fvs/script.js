document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const ledText = document.getElementById('led-text');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const timerSeconds = document.getElementById('timer-seconds');
    const progressInner = document.getElementById('progress-inner');

    let countdownInterval;

    sendBtn.addEventListener('click', () => {
        const text = userInput.value.trim();
        if (!text) {
            alert('请输入验证文字');
            return;
        }

        // 1. 禁用输入和按钮
        userInput.disabled = true;
        sendBtn.disabled = true;

        // 2. 显示倒计时遮罩
        countdownOverlay.classList.remove('hidden');
        
        let timeLeft = 10;
        timerSeconds.textContent = timeLeft;
        progressInner.style.width = '100%';

        // 3. 开始倒计时逻辑
        countdownInterval = setInterval(() => {
            timeLeft--;
            timerSeconds.textContent = timeLeft;
            
            // 更新进度条
            const progress = (timeLeft / 10) * 100;
            progressInner.style.width = `${progress}%`;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                finishCountdown(text);
            }
        }, 1000);
    });

    function finishCountdown(newText) {
        // 4. 倒计时结束，更新 LED 文字
        ledText.textContent = newText;
        
        // 重新启动跑马灯动画 (强制重绘)
        ledText.style.animation = 'none';
        ledText.offsetHeight; /* trigger reflow */
        ledText.style.animation = null;

        // 5. 隐藏倒计时遮罩
        countdownOverlay.classList.add('hidden');

        // 6. 恢复输入和按钮
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.value = '';
        userInput.focus();
    }

    // 处理回车键发送
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendBtn.disabled) {
            sendBtn.click();
        }
    });
});

