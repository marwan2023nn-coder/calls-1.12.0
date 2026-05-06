// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Channel} from '@mattermost/types/channels';
import {CommandArgs} from '@mattermost/types/integrations';
import {PluginConfiguration} from '@mattermost/types/plugins/user_settings';
import {Post} from '@mattermost/types/posts';
import {GlobalState} from '@mattermost/types/store';
import {PluginSiteStatsHandler} from '@mattermost/types/store/plugin';
import {ActionFuncAsync} from 'mattermost-redux/types/actions';
import {Store as BaseStore} from 'redux';
import {ThunkDispatch} from 'redux-thunk';
import {RealNewPostMessageProps} from 'src/types/types';

export type Translations = {
    [key: string]: string;
};

export type NewPostMessageProps = {
    mentions: string[];
    team_id: string;
}

export type DesktopNotificationArgs = {
    title: string;
    body: string;
    silent: boolean;
    soundName: string;
    url: string;
    notify: boolean;
};

export interface PluginRegistry {
    registerPostTypeComponent(typeName: string, component: React.ElementType);

    registerReducer(reducer: Reducer);

    registerGlobalComponent(component: React.ElementType);

    registerRootComponent(component: React.ElementType);

    registerSidebarChannelLinkLabelComponent(component: React.ElementType);

    registerChannelToastComponent(component: React.ElementType);

    registerChannelHeaderButtonAction(component: React.ElementType, fn: (channel: Channel) => void);

    registerChannelHeaderMenuAction(component: React.ElementType, fn: (channelID: string) => void);

    registerWebSocketEventHandler(evType: string, fn: (event: WebSocketEvent) => void);

    registerCustomRoute(route: string, component: React.ElementType);

    registerNeedsTeamRoute(route: string, component: React.ElementType);

    registerSlashCommandWillBePostedHook(hook: (message: string, args: CommandArgs) => SlashCommandWillBePostedReturn);

    // registerDesktopNotificationHook requires MM v8.1
    registerDesktopNotificationHook(hook: (post: Post, msgProps: RealNewPostMessageProps, channel: Channel, teamId: string, args: DesktopNotificationArgs) => Promise<{
        error?: string;
        args?: DesktopNotificationArgs;
    }>)

    registerCallButtonAction(
        button: React.ElementType,
        dropdownButton: React.ElementType,
        fn: (channel: Channel) => void,
        icon: React.ElementType,
        dropdownText: React.ElementType,
    );

    unregisterComponent(componentID: string);

    unregisterPostTypeComponent(componentID: string);

    registerReconnectHandler(handler: () => void);

    unregisterReconnectHandler(handler: () => void);

    registerAdminConsoleCustomSetting(key: string, component: React.FunctionComponent<CustomComponentProps>, options?: { showTitle: boolean });

    registerTranslations(handler: (locale: string) => Translations | Promise<Translations>);

    registerFilePreviewComponent(overrideFn: (fi: FileInfo, post?: Post) => boolean, component: React.ElementType);

    registerSiteStatisticsHandler(handler: PluginSiteStatsHandler);

    registerAdminConsoleCustomSection(key: string, component: React.FunctionComponent<{ settingsList: ReactNode[]; }>);

    registerUserSettings(settings: PluginConfiguration);
}

export type SlashCommandWillBePostedReturn = { error: string } | { message: string, args: CommandArgs } | unknown;

export interface CustomComponentProps {
    id: string;
    label: string;
    helpText: JSX.Element | null;
    value: string;
    disabled: boolean;
    config?: Record<string, unknown>;
    license?: Record<string, unknown>;
    setByEnv: boolean;
    onChange: (id: string, value: string | boolean | number, confirm?: boolean, doSubmit?: boolean, warning?: boolean) => void;
    saveAction: () => Promise<unknown>;
    registerSaveAction: (saveAction: () => Promise<{} | {error: {message: string}}>) => void;
    unRegisterSaveAction: (saveAction: () => Promise<unknown>) => void;
    setSaveNeeded: () => void;
    cancelSubmit: () => void;
    showConfirm: boolean;
}

/**
 * Emulated Store type used in mattermost-webapp/mattermost-redux
 */
export type Store = BaseStore<GlobalState> & { dispatch: Dispatch }

// eslint-disable-next-line
export type Dispatch = ThunkDispatch<GlobalState, any, any>

export type ModalData<ModalProps> = {
    modalId: string;
    dialogProps?: Omit<ModalProps, 'onHide' | 'onExited'> & {onHide?: () => void; onExited?: () => void};
    dialogType: React.ElementType<ModalProps>;
}

export type WebAppUtils = {

    // @ts-ignore
    modals: { openModal, ModalIdentifiers },
    notificationSounds: { ring: (sound: string) => void, stopRing: () => void },
    sendDesktopNotificationToMe: (title: string, body: string, channel: Channel, teamId: string, silent: boolean, soundName: string, url: string) => (dispatch: DispatchFunc) => void,
    openUserSettings: (dialogProps: {activeTab: string, isContentProductSettings: boolean}) => ActionFuncAsync;
    browserHistory: ReturnType<typeof getHistory>;
};

declare module '@mattermost/desktop-api' {
    export type DesktopAPI = {
        isDev: () => Promise<boolean>;
        getAppInfo: () => Promise<{
            name: string;
            version: string;
        }>;
        reactAppInitialized: () => void;
        setSessionExpired: (isExpired: boolean) => void;
        onUserActivityUpdate: (listener: (userIsActive: boolean, idleTime: number, isSystemEvent: boolean) => void) => () => void;
        onLogin: () => void;
        onLogout: () => void;
        sendNotification: (title: string, body: string, channelId: string, teamId: string, url: string, silent: boolean, soundName: string) => Promise<{
            status: string;
            reason?: string;
            data?: string;
        }>;
        onNotificationClicked: (listener: (channelId: string, teamId: string, url: string) => void) => () => void;
        setUnreadsAndMentions: (isUnread: boolean, mentionCount: number) => void;
        requestBrowserHistoryStatus: () => Promise<{
            canGoBack: boolean;
            canGoForward: boolean;
        }>;
        onBrowserHistoryStatusUpdated: (listener: (canGoBack: boolean, canGoForward: boolean) => void) => () => void;
        onBrowserHistoryPush: (listener: (pathName: string) => void) => () => void;
        sendBrowserHistoryPush: (path: string) => void;
        joinCall: (opts: {
            callID: string;
            title: string;
            rootID: string;
            channelURL: string;
        }) => Promise<{
            callID: string;
            sessionID: string;
        }>;
        leaveCall: () => void;
        callsWidgetConnected: (callID: string, sessionID: string) => void;
        resizeCallsWidget: (width: number, height: number) => void;
        sendCallsError: (err: string, callID?: string, errMsg?: string) => void;
        onCallsError: (listener: (err: string, callID?: string, errMsg?: string) => void) => () => void;
        getDesktopSources: (opts: any) => Promise<any[]>;
        openScreenShareModal: () => void;
        onOpenScreenShareModal: (listener: () => void) => () => void;
        shareScreen: (sourceID: string, withAudio: boolean) => void;
        onScreenShared: (listener: (sourceID: string, withAudio: boolean) => void) => () => void;
        sendJoinCallRequest: (callId: string) => void;
        onJoinCallRequest: (listener: (callID: string) => void) => () => void;
        openLinkFromCalls: (url: string) => void;
        focusPopout: () => void;
        openThreadForCalls: (threadID: string) => void;
        onOpenThreadForCalls: (listener: (threadID: string) => void) => () => void;
        openStopRecordingModal: (channelID: string) => void;
        onOpenStopRecordingModal: (listener: (channelID: string) => void) => () => void;
        openCallsUserSettings: () => void;
        onOpenCallsUserSettings: (listener: () => void) => () => void;
        unregister: (channel: string) => void;
        sendRemoteControlEvent: (event: any) => void;
        setRemoteControlState: (active: boolean, sessionID: string) => void;
    };
}
