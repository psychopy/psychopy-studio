<script>
    import { Button } from "$lib/ui/button";
    import { MessageDialog } from "$lib/ui/dialog"
    import { marked } from "marked";
    import { getContext, onMount } from "svelte";
    import { MenuItem, MenuSeparator, SubMenu } from "$lib/ui/menu";
    import { git } from "$lib/globals.svelte";
    import { translate } from "$lib/translation";

    let current = getContext("current");

    // load users on launch
    let loading = git.loadUsers();

    // on launch, log in as first available user, if there are any
    loading.then(
        loaded => git.listUsers().then(
            users => current.user = current.user ? current.user : users?.[0]
        )
    )

    let warnings = $state({
        show: false,
        text: ""
    })

    function validateUsername(user) {
        // username can't be all numbers
        if (user.match(/^\d+$/)) {
            warnings.show = true
            warnings.text = translate(
                "Pavlovia usernames should not be all numbers.\n\nResolve online at [pavlovia.org](https://gitlab.pavlovia.org/-/profile/account)."
            )
        }
    }

    
</script>


{#key current.user}
    {#await git.getUserInfo($state.snapshot(current.user)) then profile}
        <Button
            label={profile?.username || translate("No user")}
            onclick={(evt) => {
                if (profile) {
                    window.open(profile.web_url);
                }
            }}
            disabled={!profile}
        >
            {#snippet menu(shown)}
                <MenuItem
                    label={translate("Edit user...")}
                    icon="/icons/btn-edit.svg"
                    onclick={evt => window.open("https://gitlab.pavlovia.org/-/user_settings/profile", "_blank")}
                />
                <SubMenu 
                    label={translate("Switch user...")}
                >
                    {#await git.listUsers() then users}
                        {#each users as username}
                            <MenuItem
                                label={username}
                                onclick={evt => current.user = username}
                            />
                        {/each}
                        <MenuSeparator />
                    {/await}
                    <MenuItem
                        label={translate("New user...")}
                        onclick={async evt => {
                            // do login
                            let user = await git.login()
                            // if successful...
                            if (user) {
                                // update current user info
                                current.user = user
                                // confirm that username is okay
                                validateUsername(user)
                            }
                            
                        }}
                    />
                </SubMenu>
                <MenuSeparator />
                {#if current.user}
                    <MenuItem
                        label={translate("Logout")}
                        onclick={evt => {
                            current.user = undefined;
                            git.clearUsers();
                        }}
                    />
                {:else}
                    <MenuItem
                        label={translate("Login")}
                        onclick={async evt => {
                            let users = await git.listUsers();
                            if (users.length) {
                                current.user = users[0]
                            } else {
                                current.user = await git.login()
                            }
                        }}
                    />
                {/if}
            {/snippet}
        </Button>
    {/await}

    <MessageDialog
        title={translate("User warning")}
        bind:shown={warnings.show}
        buttons={["OK"]}
    >
        {@html marked(warnings.text)}
    </MessageDialog>
{/key}
