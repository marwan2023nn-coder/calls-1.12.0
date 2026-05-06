import {contextBridge, ipcRenderer} from 'electron';

// This would be merged into the existing desktopAPI bridge
contextBridge.exposeInMainWorld('desktopAPI', {
    // ... existing methods
    sendRemoteControlEvent: (event) => ipcRenderer.send('calls-send-remote-control-event', event),
    setRemoteControlState: (active, sessionID) => ipcRenderer.send('calls-set-remote-control-state', active, sessionID),
});
