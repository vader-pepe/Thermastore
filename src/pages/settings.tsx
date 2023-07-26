import BubbleBackground from "@/components/BubbleBackground";
import CoolButton from "@/components/CoolButton";
import { VerifyHook } from "@/utils/FileFunctions";
import { changeTheme } from "@/utils/utils";
import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react";
import { ChangeEvent, useEffect, useState } from "react";
import { themes } from "./_app";

export default function settingsPage() {
    const [hasHook, setHasHook] = useState(false);
    const [hookID, setHookID] = useState<number>();
    const { isLoading, session, error } = useSessionContext();
    const [pageLoading, setPageLoading] = useState(true);
    const supabase = useSupabaseClient();
    const [msg, setMsg] = useState("Loading user...");
    const [hook, setHook] = useState("");
    const [err, setErr] = useState("");
    const [theme, setTheme] = useState<string>("default");
    useEffect(() => {
        async function fetchData() {
            if (isLoading) return;
            setMsg("Checking for data");
            const { data, error, count } = await supabase
                .from("webhooks")
                .select("id", { count: "estimated" });
            if (error) {
                setMsg(error.message);
            } else {
                if (count && count > 0) {
                    setHasHook(true);
                    setHookID(data[0].id);
                    setHook(`https://discordapp.com/api/webhooks/0000000000000000000/...`)
                }
                setPageLoading(false);
            }
        }
        fetchData();
        let t = localStorage.getItem('theme');

        if (t) {
            setTheme(t);
        }
    }, [isLoading]);

    async function SetTheHook() {
        const validHook = await VerifyHook(hook);
        if (!validHook.isValid) {
            setErr("Not a valid hook");
            console.log(err);
            return;
        }
        const thahook = { hookNumber: validHook.hookNumber, hookId: validHook.hookId }
        if (hasHook) {
            const { error } = await supabase
                .from("webhooks")
                .update(thahook)
                .eq('id', hookID);
            if (error) {
                setErr(error.message);
                console.log(error);
                return;
            }
        } else {
            const { data, error } = await supabase
                .from('webhooks')
                .insert(thahook)
                .select('id').single()
            if (error) {
                setErr(error.message);
                console.log(error);
                return;
            }
            setHookID(data.id)
        }
        setHook(`https://discordapp.com/api/webhooks/0000000000000000000/...`);
        setErr("hook was set successfully");
        setHasHook(true);
    }

    async function deleteHook() {
        const { error } = await supabase
            .from("webhooks")
            .delete()
            .eq('id', hookID);
        if (error) {
            setErr(error.message);
            console.log(error);
            return;
        }
        setErr("hook deleted!");
        setHasHook(false);
        setHook("");
    }

    function cTheme(event: ChangeEvent<HTMLSelectElement>) {
        const theme = event.target.value;
        setTheme(theme);
        changeTheme(theme);
    }

    return (
        <div>
            {/* <BubbleBackground /> */}
            <div className="h-100vh py-[100px] px-4 text-quaternary">
                {pageLoading ? <p className="text-4xl text-center">{msg}</p> :
                    <div className="grid gap-2 text-center pb-8">
                        <div>
                            <p className="m-0 text-tertiary">Disclaimer: Your hook won't be encrypted. Anyone with your account can access it.</p>
                            <p className="m-0">{hasHook ? "You have a hook and you can change or delete it here" : "You can set up a hook here"}</p>
                        </div>
                        <input className="w-64 m-auto text-black p-2 rounded-md text-xl" onChange={w => setHook(w.target.value)} placeholder={`https://discordapp.com/api/webhooks/...`} value={hook} type="text" />
                        <CoolButton onClick={() => SetTheHook()}>Set hook</CoolButton>
                        {hasHook ? <CoolButton onClick={() => deleteHook()}>Delete hook</CoolButton> : ""}
                        <p className="text-red text-xl">{err}</p>
                        <p className="text-2xl underline">Themes</p>
                        <div className="grid gap-2 justify-center">
                            {themes.map((w, ind) => (
                                <div key={w + ind}>
                                    <CoolButton onClick={() => { changeTheme(w); setTheme(w) }} disabled={theme === w}>{w}</CoolButton>
                                </div>
                            ))}
                        </div>
                    </div>}
            </div>
        </div>
    )
}