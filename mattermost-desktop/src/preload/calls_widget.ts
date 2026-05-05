// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ipcRenderer} from 'electron';

export const callsRemoteControlAPI = {
    sendRemoteControlEvent: (event: any) => {
        ipcRenderer.send('calls-send-remote-control-event', event);
    },
};

// This would be merged into the main window.desktopAPI in the actual desktop app
(window as any).desktopAPI = {
    ...(window as any).desktopAPI,
    ...callsRemoteControlAPI,
};
