<script>
    import { DropdownButton } from "$lib/utils/buttons";
    import { getContext, onMount } from "svelte";
    import { MenuItem, MenuSeparator, SubMenu } from "$lib/utils/menu";
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
</script>

{#await loading then loaded}
    {#key current.user}
        {#await git.getUserInfo($state.snapshot(current.user)) then profile}
            <DropdownButton
                label={profile?.name || translate("No user")}
                onclick={(evt) => {
                    if (profile) {
                        window.open(profile.web_url);
                    }
                }}
                disabled={!profile}
            >
                <MenuItem
                    label={translate("Edit user...")}
                    icon="/icons/btn-edit.svg"
                    onclick={evt => window.open("https://gitlab.pavlovia.org/-/profile", "_blank")}
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
                    {/await}
                    <MenuSeparator />
                    <MenuItem
                        label={translate("New user...")}
                        onclick={async evt => current.user = await git.login()}
                    />
                </SubMenu>
                <MenuSeparator />
                {#if current.user}
                    <MenuItem
                        label={translate("Logout")}
                        onclick={evt => current.user = undefined}
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
            </DropdownButton>
        {/await}
    {/key}
{/await}
