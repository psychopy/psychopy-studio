<script>
    import { Dialog } from "$lib/utils/dialog";
    import { prefs } from "$lib/preferences.svelte.js";

    let selected = $state.raw("user")
</script>

<Dialog
    title="Environment location..."
    buttons={{
        OK: evt => {
            prefs.params.environmentsFolder.val = $state.snapshot(selected);
            prefs.save()
        }
    }}
    closable={false}
    shown
>
    <div class=content>
        <div 
            class=param-rich-choice-ctrl
        >
            <h2>Where to setup Python...</h2>
            <p>PsychoPy needs to setup Python in order to run your experiments. Where should we put Python on your machine?</p>
            <button
                class=rich-ctrl-item
                class:selected={selected === "user"}
                onclick={(evt) => selected = "user"}
            >
                <h4>User folder (recommended for labs)</h4>

                <ul class=procon>
                    <li class=pro>Each user on this computer gets control of their own PsychoPy version and plugins</li>
                    <li class=con>This can use a lot of space on machines with lots of users</li>
                </ul>
                {#if selected === "user"}
                    <p>Python environments will be created in:</p>
                    <code class=preview>
                        {#await python.uv.findDirectory("user") then location}
                            {location}{location.includes("/") ? "/" : "\\"}.python
                        {/await}
                    </code>
                {/if}
            </button>

            <button
                class=rich-ctrl-item
                class:selected={selected === "global"}
                onclick={(evt) => selected = "global"}
            >
                <h4>Shared folder (recommended for classrooms)</h4>
                <ul class=procon>
                    <li class=pro>Python is only setup once per version of PsychoPy</li>
                    <li class=pro>System admins can control who is allowed to install PsychoPy versions and plugins</li>
                    <li class=con>Installing/removing a PsychoPy version or plugin installs/removes it for everyone</li>
                </ul>
                {#if selected === "global"}
                    <p>Python environments will be created in:</p>
                    <code class=preview>
                        {#await python.uv.findDirectory("global") then location}
                            {location}{location.includes("/") ? "/" : "\\"}.python
                        {/await}
                    </code>
                {/if}
            </button>
        </div>
    </div>
</Dialog>

<style>
    .content {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        min-width: 45rem;
        padding: 2rem;
    }

    .param-rich-choice-ctrl {
        display: flex;
        flex-direction: column;
        justify-content: stretch;
        gap: .5rem;
        flex-grow: 1;
    }

    .rich-ctrl-item {
        padding: 1rem;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        opacity: 80%;
        transition: opacity .2s border-color .2s background-color .2s;
        display: flex;
        flex-direction: column;
        align-items: start;
        text-align: left;
    }

    .rich-ctrl-item.selected,
    .rich-ctrl-item:hover {
        border-color: var(--blue);
        background-color: var(--base);
    }
    .rich-ctrl-item.selected {
        opacity: 100%;
    }

    code.preview {
        width: 100%;
    }
</style>