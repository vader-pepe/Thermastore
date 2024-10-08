import { Directory, equalDir } from "@/utils/FileFunctions";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { } from "react";

export default function Pathline({ dirHistory, setDirHistory, pressedDir, rootDir }: { dirHistory: Directory[], setDirHistory?: Dispatch<SetStateAction<Directory[]>>, pressedDir?: (dir: Directory | null) => void, rootDir?: Directory }) {
    const elem = useRef<HTMLDivElement>(null);
    const [moved, setMoved] = useState(false);
    function pressedPath(dir: Directory) {
        if (pressedDir) {
            pressedDir(dir);
        }
        if (!setDirHistory) return;
        if (dirHistory.length === 0 || moved) return;
        if (!equalDir(dirHistory[dirHistory.length - 1], dir)) {
            setDirHistory(d => d.slice(0, d.findIndex(b => equalDir(b, dir)) + 1))
        }
    }

    function pressedRoot() {
        if (!moved) {
            if (setDirHistory)
                setDirHistory(w => w.length > 0 ? [] : w)
            if (pressedDir)
                pressedDir(null)
        }
    }

    let pos = { top: 0, left: 0, x: 0, y: 0 };
    function mouseMoveHandler(w: MouseEvent) {
        // How far the mouse has been moved
        const dx = w.clientX - pos.x;
        const dy = w.clientY - pos.y;
        if (Math.abs(dx) + Math.abs(dy) > 5)
            setMoved(true);
        if (!elem.current) return;
        // Scroll the element
        elem.current.scrollTop = pos.top - dy;
        elem.current.scrollLeft = pos.left - dx;
    }

    function mouseUpHandler(w: MouseEvent) {
        setTimeout(() => setMoved(false), 100);
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    }

    function mouseDownHandler(w: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (!elem.current) return;
        // Initialize position
        pos = {
            left: elem.current.scrollLeft,
            top: elem.current.scrollTop,
            x: w.clientX,
            y: w.clientY
        };

        // adding mousemove and up event listeners
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }

    useEffect(() => {
        // removing possibly active event listeners
        return () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        }
    }, [])

    return (
        <div ref={elem} onMouseDown={w => mouseDownHandler(w)} className={`flex px-5 text-quaternary overflow-x-auto scrollbar select-none ${moved ? 'cursor-grabbing' : ''}`}>
            <p onClick={() => pressedRoot()} className={`${(setDirHistory || pressedDir) ? `cursor-pointer  transition-colors duration-200 hover:text-tertiary` : ''}`}>{rootDir ? `\\${rootDir.name}` : `C:${dirHistory.length === 0 ? `\\` : ''}`}</p>
            {!rootDir && dirHistory.length > 0 ? <>
                {dirHistory[0].dir !== null ? <p>\..</p> : ''}
            </> : ""}
            {dirHistory.map(w => (
                <div key={`path${w.id}`}>
                    {/* For path access */}
                    <p onClick={() => pressedPath(w)} className={`${moved || (!setDirHistory && !pressedDir) ? '' : "cursor-pointer  transition-colors duration-200 hover:text-tertiary"} whitespace-nowrap`}>\{w.name}</p>
                </div>
            ))}
        </div>
    )
}