// Kisan Alert - Centralized Interactive Client Scripts

// Toast Notification Engine
function showToast(message, type = 'success') {
    // Remove existing toast if any
    const existing = document.getElementById('kisan-toast');
    if (existing) {
        existing.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'kisan-toast';
    toast.className = `fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-none`;
    
    // Theme configurations
    if (type === 'error') {
        toast.className += ' bg-[#ba1a1a] text-white border-[#ba1a1a]/20';
    } else if (type === 'warning') {
        toast.className += ' bg-[#fead4c] text-[#2b1700] border-[#fead4c]/20';
    } else {
        // Success
        toast.className += ' bg-[#105129] text-white border-[#105129]/20';
    }

    // Icon Selection
    let icon = 'check_circle';
    if (type === 'error') icon = 'error';
    if (type === 'warning') icon = 'warning';

    toast.innerHTML = `
        <span class="material-symbols-outlined">${icon}</span>
        <span class="font-body-md text-sm font-semibold">${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger sliding animation
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });

    // Dismiss after 4 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Global Event Listeners (Sign Out, Settings, Emergency Broadcasts)
document.addEventListener('DOMContentLoaded', () => {
    
    // Helper to find parent interactive element (a or button)
    function findInteractiveParent(el) {
        let parent = el;
        while (parent && parent !== document.body) {
            if (parent.tagName === 'A' || parent.tagName === 'BUTTON') {
                return parent;
            }
            parent = parent.parentElement;
        }
        return el;
    }

    const allElements = document.getElementsByTagName('*');
    for (let el of allElements) {
        const text = el.textContent.trim().toLowerCase();

        // 1. Sign Out Triggers
        if (el.children.length === 0 && (text === 'sign out' || text === 'logout')) {
            const interactive = findInteractiveParent(el);
            interactive.style.cursor = 'pointer';
            // Prevent duplicate bindings
            if (!interactive.dataset.boundSignout) {
                interactive.dataset.boundSignout = 'true';
                interactive.addEventListener('click', (e) => {
                    e.preventDefault();
                    showToast('Signing out securely...', 'warning');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1200);
                });
            }
        }

        // 2. Settings Drawer Toggle
        if (el.children.length === 0 && text === 'settings') {
            const interactive = findInteractiveParent(el);
            interactive.style.cursor = 'pointer';
            if (!interactive.dataset.boundSettings) {
                interactive.dataset.boundSettings = 'true';
                interactive.addEventListener('click', (e) => {
                    e.preventDefault();
                    showToast('Settings drawer opened', 'success');
                    openSettingsPanel();
                });
            }
        }
    }

    // 3. Emergency Report & Broadcast buttons
    const emergencyBtns = document.querySelectorAll('button, a');
    emergencyBtns.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('emergency report') || text.includes('emergency broadcast')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Emergency alert broadcasted via Voice/SMS to all 28,000 farmers!', 'error');
            });
        }
    });
});

// Dynamic Settings Panel creation
function openSettingsPanel() {
    let panel = document.getElementById('settings-drawer-panel');
    if (panel) {
        panel.classList.remove('hidden');
        return;
    }

    panel = document.createElement('div');
    panel.id = 'settings-drawer-panel';
    panel.className = 'fixed inset-0 bg-black/50 z-50 flex justify-end transition-all duration-300';
    
    panel.innerHTML = `
        <div class="bg-[#FBF8F1] w-80 max-w-full h-full p-6 border-l border-outline-variant/20 flex flex-col justify-between shadow-2xl">
            <div>
                <div class="flex justify-between items-center mb-6 pb-2 border-b border-soil-brown/10">
                    <h3 class="font-headline-md text-lg text-primary">System Settings</h3>
                    <button onclick="document.getElementById('settings-drawer-panel').classList.add('hidden')" class="text-soil-brown p-1 min-h-[44px] min-w-[44px]">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block font-label-caps text-xs text-outline mb-1 uppercase">Platform Language</label>
                        <select class="w-full bg-white border border-soil-brown/30 rounded-lg p-2 font-body-md focus:border-turmeric focus:outline-none">
                            <option>Telugu (Default)</option>
                            <option>Kannada</option>
                            <option>English</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-label-caps text-xs text-outline mb-1 uppercase">Ground sensor refresh frequency</label>
                        <select class="w-full bg-white border border-soil-brown/30 rounded-lg p-2 font-body-md focus:border-turmeric focus:outline-none">
                            <option>10 Minutes</option>
                            <option>30 Minutes</option>
                            <option>Hourly</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="auto-broadcast" checked class="rounded border-soil-brown/30 text-turmeric focus:ring-turmeric">
                        <label for="auto-broadcast" class="font-body-md text-sm text-soil-brown">Enable Auto Voice Broadcast</label>
                    </div>
                </div>
            </div>
            <button onclick="document.getElementById('settings-drawer-panel').classList.add('hidden'); showToast('Settings saved successfully!', 'success');" class="bg-turmeric text-soil-brown w-full py-3 rounded-lg font-bold min-h-[44px] active:scale-95 transition-transform">
                Save & Apply
            </button>
        </div>
    `;

    // Click outside to close drawer
    panel.addEventListener('click', (e) => {
        if (e.target === panel) {
            panel.classList.add('hidden');
        }
    });

    document.body.appendChild(panel);
}
