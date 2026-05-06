export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    } as T;
}

export function getRelativeCoordinates(e: MouseEvent | WheelEvent, element: HTMLVideoElement) {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Element size
    const elementWidth = rect.width;
    const elementHeight = rect.height;

    // Video native size
    const videoWidth = element.videoWidth;
    const videoHeight = element.videoHeight;

    if (videoWidth === 0 || videoHeight === 0) {
        return {x: x / elementWidth, y: y / elementHeight};
    }

    const videoAspectRatio = videoWidth / videoHeight;
    const elementAspectRatio = elementWidth / elementHeight;

    let actualWidth = elementWidth;
    let actualHeight = elementHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (elementAspectRatio > videoAspectRatio) {
        // Pillarboxed (black bars on left/right)
        actualWidth = elementHeight * videoAspectRatio;
        offsetX = (elementWidth - actualWidth) / 2;
    } else {
        // Letterboxed (black bars on top/bottom)
        actualHeight = elementWidth / videoAspectRatio;
        offsetY = (elementHeight - actualHeight) / 2;
    }

    const relativeX = (x - offsetX) / actualWidth;
    const relativeY = (y - offsetY) / actualHeight;

    return {
        x: Math.max(0, Math.min(1, relativeX)),
        y: Math.max(0, Math.min(1, relativeY)),
    };
}
