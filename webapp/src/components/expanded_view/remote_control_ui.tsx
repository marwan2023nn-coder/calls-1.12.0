import React from 'react';
import styled from 'styled-components';
import {UserProfile} from '@mattermost/types/users';
import {getUserDisplayName} from 'src/utils';

interface Props {
    requests: Array<{session_id: string, user_id: string}>;
    profiles: {[userID: string]: UserProfile};
    onGrant: (sessionID: string, userID: string) => void;
    onDeny: (sessionID: string) => void;
}

const RequestContainer = styled.div`
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 8px;
    color: white;
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const Button = styled.button<{primary?: boolean}>`
    background: ${props => props.primary ? '#166de0' : 'transparent'};
    color: white;
    border: 1px solid #166de0;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
        opacity: 0.8;
    }
`;

export const RemoteControlRequestsUI = ({requests, profiles, onGrant, onDeny}: Props) => {
    if (requests.length === 0) return null;

    return (
        <RequestContainer>
            {requests.map(req => {
                const profile = profiles[req.user_id];
                const name = profile ? getUserDisplayName(profile) : req.user_id;
                return (
                    <div key={req.session_id} style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                        <span>{name} is requesting remote control</span>
                        <div style={{display: 'flex', gap: '5px'}}>
                            <Button primary onClick={() => onGrant(req.session_id, req.user_id)}>Allow</Button>
                            <Button onClick={() => onDeny(req.session_id)}>Deny</Button>
                        </div>
                    </div>
                );
            })}
        </RequestContainer>
    );
};
