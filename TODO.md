# // FIXME: 
- can see project without accepting invitation (status still sent)
- when user message is too long, it fails!!
- can't delete empty project

# // TODO:
<!-- - when deleting agent or project => delete agent membership or project membership -->
- invite user in project => create agent membership (admin) on every agent of the project
- remove user in project => remove project membership and remove agent membership on every agent of this project
- remove user in agent => remove agent membership
- list members by agent + invite user as member to agent
- rework guards to check roles based on org-membership, project-membership, agent-membership
- create lobby at root / => list invitations to agents and project(owner/admin) and org(owner/admin)
- invite user : create org membership and project membership and if needed agent membership

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
