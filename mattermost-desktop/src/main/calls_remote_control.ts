// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ipcMain, screen} from 'electron';
import {mouse, keyboard, Button, Key} from '@nut-tree-fork/nut-js';

let remoteControlActive = false;
let authorizedSessionID = '';

export function setRemoteControlState(active: boolean, sessionID: string = '') {
    remoteControlActive = active;
    authorizedSessionID = sessionID;
}

export function setupCallsRemoteControl() {
    ipcMain.on('calls-send-remote-control-event', async (event, data) => {
        // Security validation: ensuring the control state is active and authorized.
        if (!remoteControlActive) {
            console.error('Remote control event received but state is not active.');
            return;
        }

        const {type, ...payload} = data;

        switch (type) {
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
    });
}

async function handleMouseMove({x, y, displayID}: {x: number, y: number, displayID?: string}) {
    let targetDisplay = screen.getPrimaryDisplay();
    if (displayID) {
        const displays = screen.getAllDisplays();
        const found = displays.find((d) => d.id.toString() === displayID);
        if (found) {
            targetDisplay = found;
        }
    }

    const absoluteX = targetDisplay.bounds.x + (x * targetDisplay.bounds.width);
    const absoluteY = targetDisplay.bounds.y + (y * targetDisplay.bounds.height);
    await mouse.setPosition({x: absoluteX, y: absoluteY});
}

async function handleMouseDown({button}: {button: number}) {
    const nutButton = button === 0 ? Button.LEFT : button === 2 ? Button.RIGHT : Button.MIDDLE;
    await mouse.pressButton(nutButton);
}

async function handleMouseUp({button}: {button: number}) {
    const nutButton = button === 0 ? Button.LEFT : button === 2 ? Button.RIGHT : Button.MIDDLE;
    await mouse.releaseButton(nutButton);
}

async function handleWheel({deltaX, deltaY}: {deltaX: number, deltaY: number}) {
    if (deltaY !== 0) {
        await mouse.scrollAtSpeed(deltaY > 0 ? -100 : 100, 100);
    }
}

async function handleKeyDown({key}: {key: string}) {
    // Map browser key to nut-js Key
    const nutKey = mapKey(key);
    if (nutKey !== undefined) {
        await keyboard.pressKey(nutKey);
    }
}

async function handleKeyUp({key}: {key: string}) {
    const nutKey = mapKey(key);
    if (nutKey !== undefined) {
        await keyboard.releaseKey(nutKey);
    }
}

function mapKey(key: string): Key | undefined {
    const k = key.toLowerCase();
    if (k.length === 1 && k >= 'a' && k <= 'z') {
        return (Key as any)[key.toUpperCase()];
    }
    if (k.length === 1 && k >= '0' && k <= '9') {
        return (Key as any)[`Num${k}`];
    }

    switch (k) {
    case 'enter': return Key.Enter;
    case 'escape': return Key.Escape;
    case 'backspace': return Key.Backspace;
    case 'tab': return Key.Tab;
    case ' ': return Key.Space;
    case 'arrowup': return Key.Up;
    case 'arrowdown': return Key.Down;
    case 'arrowleft': return Key.Left;
    case 'arrowright': return Key.Right;
    case 'shift': return Key.LeftShift;
    case 'control': return Key.LeftControl;
    case 'alt': return Key.LeftAlt;
    case 'meta': return Key.LeftSuper;
    default: return undefined;
    }
}
