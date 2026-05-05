// Copyright (c) 2020-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {EventEmitter} from 'events';

export enum DCMessageType {
    Signal = 'signal',
    RemoteControl = 'remote-control',
}

export interface RTCPeerConfig {
    iceServers: RTCIceServer[];
    logger: {
        logDebug: (...args: any[]) => void;
        logErr: (...args: any[]) => void;
        logWarn: (...args: any[]) => void;
        logInfo: (...args: any[]) => void;
    };
    simulcast?: boolean;
    dcSignaling?: boolean;
    dcLocking?: boolean;
}

export class RTCPeer extends EventEmitter {
    private pc: RTCPeerConnection;
    private config: RTCPeerConfig;
    private remoteControlDC: RTCDataChannel | null = null;
    private signalingDC: RTCDataChannel | null = null;

    constructor(config: RTCPeerConfig) {
        super();
        this.config = config;
        this.pc = new RTCPeerConnection({
            iceServers: config.iceServers,
        });

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.emit('candidate', event.candidate);
            }
        };

        this.pc.ontrack = (event) => {
            // Logic to emit stream event, simplified for this implementation
            this.emit('stream', event.streams[0], (event.track as any).trackInfo);
        };

        this.pc.onconnectionstatechange = () => {
            if (this.pc.connectionState === 'connected') {
                this.emit('connect');
            } else if (this.pc.connectionState === 'closed' || this.pc.connectionState === 'failed') {
                this.emit('close');
            }
        };

        if (config.dcSignaling) {
            this.signalingDC = this.pc.createDataChannel('signaling', {negotiated: true, id: 0});
            this.setupDataChannel(this.signalingDC);
        }

        // Initialize Remote Control Data Channel
        this.remoteControlDC = this.pc.createDataChannel('remote-control-dc', {
            ordered: true,
        });
        this.setupRemoteControlDC(this.remoteControlDC);
    }

    private setupDataChannel(dc: RTCDataChannel) {
        dc.onmessage = (event) => {
            this.emit('dc-message', dc.label, event.data);
        };
        dc.onopen = () => {
            this.config.logger.logDebug(`DataChannel ${dc.label} opened`);
        };
        dc.onclose = () => {
            this.config.logger.logDebug(`DataChannel ${dc.label} closed`);
        };
    }

    private setupRemoteControlDC(dc: RTCDataChannel) {
        dc.onopen = () => {
            this.config.logger.logDebug('Remote Control DataChannel opened');
        };
        dc.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                this.emit('remote-control-message', msg);
            } catch (err) {
                this.config.logger.logErr('Failed to parse remote control message', err);
            }
        };
    }

    public async signal(data: string) {
        const msg = JSON.parse(data);
        if (msg.type === 'offer') {
            await this.pc.setRemoteDescription(new RTCSessionDescription(msg));
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            this.emit('answer', answer);
        } else if (msg.type === 'answer') {
            await this.pc.setRemoteDescription(new RTCSessionDescription(msg));
        } else if (msg.type === 'candidate') {
            await this.pc.addIceCandidate(new RTCIceCandidate(msg));
        }
    }

    public sendRemoteControlEvent(event: any) {
        if (this.remoteControlDC && this.remoteControlDC.readyState === 'open') {
            this.remoteControlDC.send(JSON.stringify({
                type: DCMessageType.RemoteControl,
                data: event,
            }));
        }
    }

    public async addTrack(track: MediaStreamTrack, stream: MediaStream, options?: any) {
        this.pc.addTrack(track, stream);
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.emit('offer', offer);
    }

    public async replaceTrack(oldTrackID: string, newTrack: MediaStreamTrack | null) {
        const sender = this.pc.getSenders().find(s => s.track?.id === oldTrackID);
        if (sender) {
            await sender.replaceTrack(newTrack);
        }
    }

    public async addStream(stream: MediaStream) {
        stream.getTracks().forEach(track => this.pc.addTrack(track, stream));
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.emit('offer', offer);
    }

    public async removeTrack(trackID: string) {
        const sender = this.pc.getSenders().find(s => s.track?.id === trackID);
        if (sender) {
            this.pc.removeTrack(sender);
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            this.emit('offer', offer);
        }
    }

    public async getStats() {
        return this.pc.getStats();
    }

    public destroy() {
        this.pc.close();
        this.remoteControlDC?.close();
        this.signalingDC?.close();
    }

    public static async getVideoCodec(mimeType: string): Promise<RTCRtpCodecCapability | null> {
        const capabilities = RTCRtpSender.getCapabilities('video');
        if (capabilities && capabilities.codecs) {
            return capabilities.codecs.find(c => c.mimeType === mimeType) || null;
        }
        return null;
    }
}
