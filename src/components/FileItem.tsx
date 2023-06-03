import { BytesToReadable, Directory, DirFile, equalDir, getFileIconName, getFileType, getReadableDate, indexOfSelected } from "@/utils/FileFunctions"
import { supabase } from "@/utils/Supabase";
import Link from "next/link"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import FlipCard from "./FlipCard";
import PlayCircle from "./PlayCircle";
import SelectionBubble from "./SelectionBubble";
import { PlayStatus } from "./ShowFiles";
import StrechableText from "./StrechableText";
import IconDownload from "@/icons/IconDownload";
import { FileActionType, useFileManager } from "@/context/FileManagerContext";
import PreviewFile from "./PreviewFile";

interface Props {
    file: DirFile,
    selected?: (DirFile | Directory)[],
    setSelected?: Dispatch<SetStateAction<(DirFile | Directory)[]>>,
    playing: PlayStatus | undefined,
    togglePlay: Function,
    selectable?: boolean,
    SelectMultiple?: Function,

}
export default function FileItem({ file, selected, setSelected, playing, togglePlay, selectable, SelectMultiple }: Props) {
    const lref = useRef<any>(null);
    const refCopy = useRef<any>(null);
    const refOptions = useRef<any>(null);
    const audioBtn = useRef<any>(null);
    const [isNaming, setIsNaming] = useState(false);
    const [name, setName] = useState<string>(file.name);
    const [open, setOpen] = useState(false);
    const [informCopy, setInformCopy] = useState("Copy link");

    const [elemDisplay, setElemDisplay] = useState(false);
    const [elemTimer, setElemTimer] = useState<NodeJS.Timer>();
    const [tmout, setTmout] = useState<NodeJS.Timeout>();

    const fm = useFileManager();
    useEffect(() => {
        setName(file.name);
        setIsNaming(false);
    }, [file])

    useEffect(() => {
        clearTimeout(elemTimer);
        if (open) {
            setElemDisplay(true);
        } else {
            setElemTimer(setTimeout(() => setElemDisplay(false), 300))
        }
    }, [open])

    function copyClipboard() {
        navigator.clipboard.writeText(lref.current.href);
        setInformCopy("Link Copied!");
        if (tmout) {
            clearTimeout(tmout);
        }
        setTmout(setTimeout(() => setInformCopy("Copy link"), 2000))
    }

    // logic for selecting and deselecting file. 
    function clicked(w: any) {
        // if theres no selectable selected or setSelected functions won't be able to select this file
        if (!selectable || !selected || !setSelected) return;
        // if cliced on link, copy, audio - don't select
        if (!(lref.current && lref.current.contains(w.target) ||
            refCopy.current && refCopy.current.contains(w.target) ||
            audioBtn.current && audioBtn.current.contains(w.target) ||
            refOptions.current && refOptions.current.contains(w.target))) {
            const rez = indexOfSelected(selected, file);
            if (SelectMultiple && w.shiftKey) {
                SelectMultiple(file, rez !== -1);
            } else if (rez === -1) {
                setSelected(el => [...el, file]);
            } else {
                setSelected(el => [...el.slice(0, rez), ...el.slice(rez + 1)]);
            }
        }
    }

    async function saveName() {
        setIsNaming(false);
        if (name.length < 3) {
            setName(file.name);
            alert("File name is too short");
        } else if (name.length > 64) {
            setName(file.name);
            alert("File name is too long");
        } else {
            const { error } = await supabase
                .from("files")
                .update({ name })
                .eq("id", file.id);
            if (error) {
                console.log(error);
                alert(error.message);
            }
        }
    }


    return (
        <div onClick={w => clicked(w)} className="grid card group">
            <div className="flex justify-between gap-1 overflow-hidden">
                <SelectionBubble file={file} selected={selected}>
                    <div className="flex gap-2 items-center overflow-hidden">
                        <div className="w-5 h-5 m-auto block">
                            {getFileType(file.name) === 'audio' ? equalDir(playing?.playFile, file) ?
                                <div onClick={() => togglePlay(file)} ref={audioBtn}>
                                    <PlayCircle className="cursor-pointer text-file hover:text-filehover transition-colors duration-200" radius={11} percent={playing?.percent} stroke={1} paused={playing?.paused} />
                                </div> :
                                <FlipCard>
                                    <i className={`gg-${getFileIconName(file.name)} m-auto text-file group-hover:text-filehover transition-colors duration-200`}></i>
                                    <div onClick={() => togglePlay(file)} ref={audioBtn}>
                                        <PlayCircle className="cursor-pointer text-file hover:text-filehover transition-colors duration-200" radius={11} stroke={1} />
                                        {/* <button className={playing?.playFile.created_at === file.created_at ? "hidden" : ""} onClick={() => togglePlay(file)}><i className="gg-play-button-o m-auto text-blue-900 group-hover:text-blue-700 transition-colors duration-200"></i></button>
                                    <button className={playing?.playFile.created_at !== file.created_at ? "hidden" : ""} onClick={() => togglePlay(file)}><i className="gg-play-pause-o m-auto text-blue-900 group-hover:text-blue-700 transition-colors duration-200"></i></button> */}
                                    </div>
                                </FlipCard> :
                                <i className={`gg-${getFileIconName(file.name)} m-auto text-file group-hover:text-filehover transition-colors duration-200`}></i>
                            }

                        </div>
                        {isNaming ?
                            <form ref={lref} onSubmit={w => { w.preventDefault(); saveName(); }}>
                                <input type="text" autoFocus value={name} onChange={w => setName(w.target.value)} onBlur={saveName} />
                            </form> :
                            <Link className="flex transition-colors overflow-hidden text-black hover:text-file" ref={lref} href={`/download/${file.chanid}/${file.fileid}`}>
                                <StrechableText text={name} />
                            </Link>}
                    </div>
                </SelectionBubble>
                <div className="flex gap-2 items-center">
                    <p className="whitespace-nowrap">{BytesToReadable(file.size)}</p>
                    <div onClick={() => setOpen(w => !w)} ref={refCopy} className="relative w-[22px] h-[22px]">
                        <i className={`gg-chevron-down z-10 text-file w-[22px] h-[22px] cursor-pointer hover:text-filehover transition-all ${open ? 'rotate-180' : ''}`}></i>
                    </div>
                </div>
            </div>
            <div className={`transition-all w-full ease-in-out duration-300 flex flex-col gap-1 justify-between select-none overflow-hidden ${open ? ' max-h-[1000px]  mt-1' : 'max-h-0'}`}>
                {elemDisplay ? <>
                    <div className="flex justify-between">
                        <div className="grid justify-start">
                            <p>Created {getReadableDate(file.created_at)}</p>
                        </div>
                        <div ref={refOptions} className="grid gap-1 justify-start">
                            <div onClick={() => copyClipboard()} className="flex justify-end gap-2 items-center cursor-pointer text-file hover:text-filehover transition-colors duration-200">
                                <p className="whitespace-nowrap">{informCopy}</p>
                                <abbr
                                    title="Copy link"
                                    className="w-6 h-6 flex justify-center items-center">
                                    <i className="gg-link "></i>
                                </abbr>
                            </div>
                            <div onClick={() => fm?.dispatch({ type: FileActionType.DOWNLOAD, cid: file.chanid, fid: file.fileid })} className="flex justify-end gap-2 items-center cursor-pointer text-file hover:text-filehover transition-colors duration-200">
                                <p className="whitespace-nowrap">Download</p>
                                <abbr title="Download">
                                    <IconDownload />
                                </abbr>
                            </div>
                            {!isNaming && selectable ? <div onClick={() => setIsNaming(w => !w)} className="flex gap-2 items-center justify-end cursor-pointer mr-0.5 text-file hover:text-filehover transition-colors duration-200">
                                <p>Rename</p>
                                <abbr title="Rename"><i className="gg-rename"></i></abbr>
                            </div> : ""}
                        </div>
                    </div>
                    <PreviewFile dirFile={file} cid={file.chanid} fid={file.fileid} />
                </> : ''}
            </div>
        </div>
    )
}