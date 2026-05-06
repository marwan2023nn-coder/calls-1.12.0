// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {useSelector} from 'react-redux';
import {batchActions} from 'redux-batched-actions';
import {useDispatch} from 'react-redux';
import CompassIcon from 'src/components/icons/compassIcon';
import MonitorAccount from 'src/components/icons/monitor_account';
import {HOST_CONTROL_NOTICE_TIMEOUT} from 'src/constants';
import {getCallsClient} from 'src/utils';
import {HOST_CONTROL_NOTICE_TIMEOUT_EVENT} from 'src/action_types';
import {hostControlNoticesForCurrentCall} from 'src/selectors';
import {HostControlNoticeType} from 'src/types/types';
import styled, {css, keyframes} from 'styled-components';

type Props = {
    onWidget?: boolean;
}

export const HostNotices = ({onWidget = false}: Props) => {
    const currentUserId = useSelector(getCurrentUserId);
    const notices = useSelector(hostControlNoticesForCurrentCall);
    const dispatch = useDispatch();

    const youAreHostMsg = <FormattedMessage defaultMessage={'You are now the host'}/>;

    const onRemoteControlGrant = (userID: string, noticeID: string, callID: string) => {
        getCallsClient()?.sendRemoteControl('grant', {user_id: userID});
        dispatch(batchActions([
            {
                type: HOST_CONTROL_NOTICE_TIMEOUT_EVENT,
                data: {
                    callID,
                    noticeID,
                },
            },
        ]));
    };

    const onRemoteControlReject = (noticeID: string, callID: string) => {
        dispatch(batchActions([
            {
                type: HOST_CONTROL_NOTICE_TIMEOUT_EVENT,
                data: {
                    callID,
                    noticeID,
                },
            },
        ]));
    };

    return (
        <>
            {notices.map((n) => {
                switch (n.type) {
                case HostControlNoticeType.LowerHand:
                    return (
                        <Notice
                            key={n.noticeID}
                            data-testid={'notice-lower-hand'}
                            $onWidget={onWidget}
                        >
                            <StyledCompassIcon
                                icon={'hand-right-outline-off'}
                                $onWidget={onWidget}
                            />
                            <Text $onWidget={onWidget}>
                                <FormattedMessage
                                    defaultMessage={'<b>{host}</b> lowered your hand'}
                                    values={{
                                        b: (text: React.ReactNode) => <b>{text}</b>,
                                        host: n.displayName,
                                    }}
                                />
                            </Text>
                        </Notice>
                    );
                case HostControlNoticeType.HostChanged:
                    return (
                        <Notice
                            key={n.noticeID}
                            data-testid={'notice-host-changed'}
                            $onWidget={onWidget}
                        >
                            <StyledMonitorAccount $onWidget={onWidget}/>
                            <Text $onWidget={onWidget}>
                                {n.userID === currentUserId ? youAreHostMsg : (
                                    <FormattedMessage
                                        defaultMessage={'<b>{name}</b> is now the host'}
                                        values={{
                                            b: (text: React.ReactNode) => <b>{text}</b>,
                                            name: n.displayName,
                                        }}
                                    />)
                                }
                            </Text>
                        </Notice>
                    );
                case HostControlNoticeType.HostRemoved:
                    return (
                        <Notice
                            key={n.noticeID}
                            data-testid={'notice-removed'}
                            $onWidget={onWidget}
                        >
                            <RedStyledCompassIcon
                                icon={'minus-circle-outline'}
                                $onWidget={onWidget}
                            />
                            <Text $onWidget={onWidget}>
                                <FormattedMessage
                                    defaultMessage={'<b>{name}</b> was removed from the call'}
                                    values={{
                                        b: (text: React.ReactNode) => <b>{text}</b>,
                                        name: n.displayName,
                                    }}
                                />
                            </Text>
                        </Notice>
                    );
                case HostControlNoticeType.RemoteControlRequest:
                    return (
                        <Notice
                            key={n.noticeID}
                            data-testid={'notice-remote-control-request'}
                            $onWidget={onWidget}
                        >
                            <StyledCompassIcon
                                icon={'monitor'}
                                $onWidget={onWidget}
                            />
                            <Text $onWidget={onWidget}>
                                <FormattedMessage
                                    defaultMessage={'<b>{name}</b> wants remote control'}
                                    values={{
                                        b: (text: React.ReactNode) => <b>{text}</b>,
                                        name: n.displayName,
                                    }}
                                />
                            </Text>
                            {!onWidget && (
                                <div style={{display: 'flex', gap: '4px', marginInlineStart: '8px'}}>
                                    <button
                                        className='btn btn-primary btn-sm'
                                        onClick={() => onRemoteControlGrant(n.userID!, n.noticeID, n.callID)}
                                    >
                                        <FormattedMessage defaultMessage='Grant'/>
                                    </button>
                                    <button
                                        className='btn btn-secondary btn-sm'
                                        onClick={() => onRemoteControlReject(n.noticeID, n.callID)}
                                    >
                                        <FormattedMessage defaultMessage='Reject'/>
                                    </button>
                                </div>
                            )}
                        </Notice>
                    );
                default:
                    return null;
                }
            })}
        </>
    );
};

const slideInAnimation = keyframes`
    0%, 100% {
        transform: translateY(100%);
        opacity: 0;
    }
    10% {
        transform: translateY(0);
        opacity: 1;
    }
    90% {
        transform: translateY(0);
        opacity: 1;
    }
`;

const Notice = styled.div<{ $onWidget?: boolean }>`
    animation: ${slideInAnimation} ${HOST_CONTROL_NOTICE_TIMEOUT}ms ease-in-out 0.2s both;
    display: flex;
    align-items: center;
    padding: 6px 16px 6px 8px;
    gap: 8px;
    border-radius: 16px;
    width: fit-content;

    font-size: 14px;
    line-height: 20px;
    background: var(--button-color);

    ${({$onWidget}) => $onWidget && css`
        width: 100%;
        border-radius: 8px;
        padding: 4px 6px;
        font-size: 11px;
        white-space: pre;
        background: var(--center-channel-bg);
        border: solid 1px rgba(var(--center-channel-color-rgb), 0.16);
        box-shadow: 0 6px 14px 0 rgba(0, 0, 0, 0.12);
    `}
`;

const StyledCompassIcon = styled(CompassIcon)<{ $onWidget?: boolean }>`
    color: var(--away-indicator);
    font-size: ${({$onWidget}) => ($onWidget ? 16 : 18)}px;
    margin-inline-end: ${({$onWidget}) => ($onWidget ? -4 : -5)}px;
   margin-inline-start: -3px;
`;

const RedStyledCompassIcon = styled(StyledCompassIcon)`
    color: var(--dnd-indicator);
`;

export const StyledMonitorAccount = styled(MonitorAccount)<{ $onWidget?: boolean }>`
    flex: none;
   margin-inline-start: 0;
    margin-top: 1px;
    fill: rgba(var(--calls-bg-rgb), 0.56);
    width: 18px;

    ${({$onWidget}) => $onWidget && css`
        fill: var(--center-channel-color-64);
       margin-inline-start: 1px;
        width: 14px;
    `};
`;

const Text = styled.span<{ $onWidget?: boolean }>`
    color: var(--calls-bg);

    ${({$onWidget}) => $onWidget && css`
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: 'Effra_Trial_Rg';
        color: var(--center-channel-color);
    `}
`;
