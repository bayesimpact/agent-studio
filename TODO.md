# // FIXME: 
- can see project without accepting invitation (status still sent)
- when user message is too long, it fails!!
- can't delete empty project

# // TODO:
- delete agent membership or project membership when deleting agent or project
- invite user in project => create agent membership on every agent of the project
- remove user in project => remove project membership and remove agent membership on every agent of this project
- 


- add zod i18n keys
- tools/helpers to seed store in storybook
- remove ttl
- delete chat session
- use moostache to compile master-prompt+variables(locale, defaultprompt)
- write LLM Rules for any IDE

## Dangerous for nest?
`--experimental-vm-modules`

org_membership: role=admin
workspace_membership: role=admin
agent_membership: role:user/admin

when creating agent -> every admin of workspace are admin in agent_membership
