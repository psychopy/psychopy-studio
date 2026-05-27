<script>
    import { python } from "$lib/globals.svelte";
    import VenvChooser from "./VenvChooser.svelte"
    import ProgressDlg from "./ProgressDlg.svelte";
    import { Dialog } from "$lib/utils/dialog"

    let {
        shown=$bindable()
    } = $props()

    let showProgress = $state.raw(false)
    let details = $state({
        venv: "app",
        repo: "https://github.com/psychopy/psychopy",
        branch: "dev"
    })
</script>


<Dialog
    id=plugin-mgr
    title="Install PsychoPy from Git"
    buttons={{
        OK: evt => {
            showProgress = true
            shown = false
            python.venv.installPackage(
                details.venv,
                `git+${details.repo}@${details.branch}`
            )
        },
        CANCEL: evt => {}
    }}
    bind:shown={shown}
    shrink
>
    <div class=content>
        <div class=instructions>
            <p>
                Installing the PsychoPy library from Git allows you to test out fixes and changes to the PsychoPy library from within PsychoPy Studio. This is not recommended for general use, only if you are testing a fix from the developers or wanting to <a href="https://psychopy.org/contributing">contribute to PsychoPy</a>.
            </p>
            <p>
                Installing PsychoPy this way requires you to have <a href="https://git-scm.com/install/">Git installed on your system</a>.
            </p>
        </div>

        Python environment:
        <VenvChooser 
            bind:value={details.venv}
        />
        Git repository:
        <input bind:value={details.repo} />
        Branch:
        <input bind:value={details.branch} />

        <hr />

        This will run the following command on OK:
        <code class=preview>
            uv pip install git+{details.repo}@{details.branch} --python 
            {#await python.venv.executable(details.venv) then executable}
                {executable}
            {/await}
        </code>
        <hr />
        
    </div>
</Dialog>

<ProgressDlg 
    tag="uv"
    bind:shown={showProgress}
/>

<style>
    .content {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        width: 55rem;
        padding: 1rem;
        box-sizing: border-box;
    }
</style>