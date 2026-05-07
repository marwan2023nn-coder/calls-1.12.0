import {ipcMain} from 'electron';
import {mouse, keyboard, Button, Point, Key} from '@nut-tree-fork/nut-js';

let remoteControlActive = false;
let authorizedSessionID = '';

export function setupRemoteControlHandlers() {
    ipcMain.on('calls-set-remote-control-state', (event, active: boolean, sessionID: string) => {
        remoteControlActive = active;
        authorizedSessionID = sessionID;
    });

    ipcMain.on('calls-send-remote-control-event', async (event, payload: any) => {
        if (!remoteControlActive) {
            return;
        }

        try {
            switch (payload.type) {
                case 'mousemove':
                    await handleMouseMove(payload);
                    break;
                case 'mousedown':
                    await handleMouseDown(payload);
                    break;
                case 'mouseup':
                    await handleMouseUp(payload);
                    break;
                case 'wheel':
                    await handleWheel(payload);
                    break;
                case 'keydown':
                    await handleKeyDown(payload);
                    break;
                case 'keyup':
                    await handleKeyUp(payload);
                    break;
            }
        } catch (err) {
            console.error('Remote control simulation error:', err);
        }
    });
}

async function handleMouseMove(data: {x: number, y: number}) {
    // Assuming we are controlling the primary display or the shared one.
    // In a full implementation, we'd map percentage to the specific shared window/screen bounds.
    const screenWidth = 1920; // Example
    const screenHeight = 1080; // Example
    const targetPoint = new Point(data.x * screenWidth, data.y * screenHeight);
    await mouse.setPosition(targetPoint);
}

async function handleMouseDown(data: {button: number}) {
    const btn = data.button === 0 ? Button.LEFT : data.button === 2 ? Button.RIGHT : Button.MIDDLE;
    await mouse.pressButton(btn);
}

async function handleMouseUp(data: {button: number}) {
    const btn = data.button === 0 ? Button.LEFT : data.button === 2 ? Button.RIGHT : Button.MIDDLE;
    await mouse.releaseButton(btn);
}

async function handleWheel(data: {deltaX: number, deltaY: number}) {
    if (data.deltaY > 0) {
        await mouse.scrollDown(data.deltaY);
    } else if (data.deltaY < 0) {
        await mouse.scrollUp(Math.abs(data.deltaY));
    }
}

async function handleKeyDown(data: {key: string}) {
    const nutKey = mapToNutKey(data.key);
    if (nutKey) {
        await keyboard.pressKey(nutKey);
    }
}

async function handleKeyUp(data: {key: string}) {
    const nutKey = mapToNutKey(data.key);
    if (nutKey) {
        await keyboard.releaseKey(nutKey);
    }
}

function mapToNutKey(key: string): Key | null {
    // Simplified mapping
    switch (key) {
        case 'Enter': return Key.Enter;
        case 'Escape': return Key.Escape;
        case 'Tab': return Key.Tab;
        case 'Backspace': return Key.Backspace;
        // ... add more mappings
        default: return null;
    }
}
